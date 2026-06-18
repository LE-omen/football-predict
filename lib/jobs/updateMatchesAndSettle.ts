// lib/jobs/updateMatchesAndSettle.ts
// Data flow:
//   1. lazq API -> fixtures + odds (per-option)
//   2. ESPN API -> scores + match status (post=finished)
//   3. Auto-settle finished matches

import * as fs from 'fs';
import * as path from 'path';
import { createAdminClient } from '../supabase/admin';
import { adjustPoints } from '../points';
import { MULTIPLIER_DEFAULT } from '../constants';
import { fetchWorldCupFixtures } from '../lazq';
import { is1x2Hit, isExactScoreHit, isTotalGoalsHit, isBttsHit, isHt1x2Hit, calcPayout } from '../markets';
import { autoLockMarkets } from './lock';
import { normalizeFromApiResponse, persistNormalized, loadNormalizedFromFile, type NormalizedMatch } from '../data-providers/lazqNormalize';
import { extractOdds, type ExtractedOdds } from '../data-providers/lazqOddsExtractor';
import { fetchEspnScoreboard, type EspnEvent } from '../data-providers/espnClient';
import type { MarketType } from '../../types/database';
import { settleParlaysForMatch } from '../parlaySettle';

export interface JobResult {
  ok: boolean; message: string;
  createdMatchesCount: number; updatedMatchesCount: number; settledMatchesCount: number;
  lockedCount: number; predictionsUpdatedCount: number; pointsAwardedCount: number;
  oddsBackfilledCount: number; scoreUpdatedCount: number; errors: string[];
}

const MARKET_DEFS: { market_type: MarketType; title: string; options: string[] }[] = [
  { market_type: '1x2', title: '\u80DC\u5E73\u8D1F', options: ['home', 'draw', 'away'] },
  { market_type: 'exact_score', title: '\u51C6\u786E\u6BD4\u5206', options: ['0-0','1-0','0-1','1-1','2-0','0-2','2-1','1-2','2-2','3-0','0-3','3-1','1-3','3-2','2-3','other_home','other_draw','other_away'] },
  { market_type: 'total_goals', title: '\u603B\u8FDB\u7403', options: ['0','1','2','3','4','5','6','7+'] },
  { market_type: 'btts', title: '\u53CC\u65B9\u662F\u5426\u8FDB\u7403', options: ['yes', 'no'] },
  { market_type: 'ht_1x2', title: '\u534A\u573A\u80DC\u5E73\u8D1F', options: ['home', 'draw', 'away'] },
];

function getOptionOddsForMarket(marketType: MarketType, odds: ExtractedOdds): Record<string, string> {
  switch (marketType) {
    case '1x2': return odds['1x2'];
    case 'exact_score': return odds.exact_score;
    case 'total_goals': return odds.total_goals;
    case 'btts': return odds.btts;
    case 'ht_1x2': return odds['ht_1x2'];
    default: return {};
  }
}

function defaultMultiplier(optionOdds: Record<string, string>, fallback: number): number {
  const values = Object.values(optionOdds).map(Number).filter(v => !isNaN(v) && v > 0);
  return values.length > 0 ? Math.min(...values) : fallback;
}

function isPlaceholderMatch(nm: NormalizedMatch): boolean {
  return /[\[\]\u80DC\u8005\u8D25\u8005]/.test(nm.homeTeam) || /[\[\]\u80DC\u8005\u8D25\u8005]/.test(nm.awayTeam);
}

// --- ESPN name mapping ---
// Lazq team name mapping (EN -> CN) loaded from lazq API
const LAZQ_EN_TO_CN: Record<string, string> = {};

// ESPN name -> lazq name normalization
const ESPN_TO_LAZQ: Record<string, string> = {
  'Czechia': 'Czech Republic',
  'T\u00fcrkiye': 'Turkey',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
  'Democratic Republic Congo': 'Democratic Rep Congo',
  'Cape Verde Islands': 'Cape Verde',
  'United States': 'USA',
  'Cura\u00e7ao': 'Curacao',
};

function espnToCn(espnName: string): string {
  const lazqName = ESPN_TO_LAZQ[espnName] ?? espnName;
  return LAZQ_EN_TO_CN[lazqName] ?? espnName;
}

/** Load lazq team mapping from their API response */
function loadLazqTeams(resp: any): void {
  try {
    const teams = resp?.data?.teams;
    if (!teams) return;
    // teams is array of [id, cn, en] sub-arrays OR flat [id, cn, en, ...]
    if (Array.isArray(teams) && teams.length > 0) {
      if (Array.isArray(teams[0])) {
        // 2D array: [[id, cn, en], ...]
        for (const entry of teams) {
          const en = String(entry[2] ?? "");
          const cn = String(entry[1] ?? "");
          if (en && cn && !en.startsWith("[")) LAZQ_EN_TO_CN[en] = cn;
        }
      } else {
        // flat array: [id, cn, en, id, cn, en, ...]
        for (let i = 0; i < teams.length; i += 3) {
          const cn = String(teams[i + 1] ?? "");
          const en = String(teams[i + 2] ?? "");
          if (en && cn && !en.startsWith("[")) LAZQ_EN_TO_CN[en] = cn;
        }
      }
    }
    console.log(`Loaded ${Object.keys(LAZQ_EN_TO_CN).length} lazq team mappings`);
  } catch (e) { console.log(`Lazq team load error: ${e instanceof Error ? e.message : String(e)}`); }
}

/** Fetch ESPN finished matches and build a map: chineseTeamName -> {homeScore, awayScore, htHome, htAway} */
async function fetchEspnScores(): Promise<Map<string, { homeScore: number; awayScore: number; htHome: number | null; htAway: number | null }>> {
  const scoreMap = new Map<string, { homeScore: number; awayScore: number; htHome: number | null; htAway: number | null }>();

  // Fetch a wide date range covering all WC matches
  try {
    const events = await fetchEspnScoreboard('20260611', '20260801');
    for (const ev of events) {
      const comp = ev.competitions[0];
      if (!comp || comp.status.type.state !== 'post') continue;

      const homeComp = comp.competitors.find(c => c.homeAway === 'home');
      const awayComp = comp.competitors.find(c => c.homeAway === 'away');
      if (!homeComp || !awayComp) continue;

      const hs = parseInt(homeComp.score ?? '', 10);
      const as = parseInt(awayComp.score ?? '', 10);
      if (isNaN(hs) || isNaN(as)) continue;

      const homeCn = espnToCn(homeComp.team.displayName);
      const awayCn = espnToCn(awayComp.team.displayName);

      // Half scores from linescores if available
      let htHome: number | null = null;
      let htAway: number | null = null;
      if (homeComp.linescores && homeComp.linescores.length > 0) htHome = homeComp.linescores[0].value ?? null;
      if (awayComp.linescores && awayComp.linescores.length > 0) htAway = awayComp.linescores[0].value ?? null;

      // Use team name pair as key (also try reverse for matching)
      const key = `${homeCn}|${awayCn}`;
      scoreMap.set(key, { homeScore: hs, awayScore: as, htHome, htAway });

      // Store ESPN event ID for reference
      console.log(`ESPN: ${homeCn} ${hs}-${as} ${awayCn} (event:${ev.id})`);
    }
    console.log(`ESPN scoreboard: ${scoreMap.size} finished matches`);
  } catch (e) {
    console.log(`ESPN fetch failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  return scoreMap;
}

// --- Scraper data (for odds fallback) ---
interface ScraperData {
  oddsMap: Map<string, ExtractedOdds>;
}

function loadScraperData(): ScraperData {
  return { oddsMap: new Map() };
}

async function loadOddsFromSupabase(): Promise<Map<string, ExtractedOdds>> {
  const oddsMap = new Map<string, ExtractedOdds>();
  try {
    const admin = createAdminClient();
    // Load ALL odds from Supabase - key by fixture_id (lazq external_id)
    const { data, error } = await admin
      .from('external_odds_raw')
      .select('fixture_id, bet_label, values_json')
      .eq('bookmaker_name', 'lazq')
      .eq('bet_key', 'all_markets');
    if (error || !data) { console.log('Supabase odds load error: ' + (error?.message ?? '')); return oddsMap; }
    for (const row of data) {
      const fixtureId = String(row.fixture_id);
      const odds = row.values_json as Record<string, Record<string, string>>;
      const extracted: ExtractedOdds = {
        '1x2': odds['1x2'] ?? {},
        exact_score: odds['exact_score'] ?? {},
        total_goals: odds['total_goals'] ?? {},
        btts: odds['btts'] ?? {},
        'ht_1x2': odds['ht_1x2'] ?? {},
      };
      // Key by fixture_id (external_id) AND by bet_label (team names) for flexible matching
      oddsMap.set(fixtureId, extracted);
      if (row.bet_label) oddsMap.set(row.bet_label, extracted);
    }
    console.log('Loaded ' + oddsMap.size + ' odds entries from Supabase (' + data.length + ' rows)');
  } catch (e) { console.log('Supabase odds load error: ' + (e instanceof Error ? e.message : String(e))); }
  return oddsMap;
}

async function fetchNormalized(): Promise<NormalizedMatch[]> {
  let apiResp: any;
  let apiMatches: NormalizedMatch[] = [];
  try {
    apiResp = await fetchWorldCupFixtures(2026);
    loadLazqTeams(apiResp);
    apiMatches = normalizeFromApiResponse(apiResp as any);
  } catch (e) { console.log(`lazq API failed (${e instanceof Error ? e.message : String(e)}), using local file`); apiMatches = loadNormalizedFromFile() ?? []; }
  if (apiMatches.length === 0) return [];

  const oddsMap = await loadOddsFromSupabase();

  return apiMatches.filter(m => !isPlaceholderMatch(m)).map(m => {
    const key = m.homeTeam + '|' + m.awayTeam;
    const sOdds = oddsMap.get(key);
    if (sOdds) {
      for (const k of ['1x2', 'exact_score', 'total_goals', 'btts', ] as const) {
        if (Object.keys(sOdds[k]).length > 0) m.odds[k] = { ...sOdds[k] };
      }
    }
    return m;
  });
}

// --- Settlement ---
function resolveMarketResult(marketType: MarketType, ftH: number, ftA: number, htH: number, htA: number, sel: string): boolean {
  switch (marketType) {
    case '1x2': return is1x2Hit(ftH, ftA, sel);
    case 'exact_score': return isExactScoreHit(ftH, ftA, sel);
    case 'total_goals': return isTotalGoalsHit(ftH, ftA, sel);
    case 'btts': return isBttsHit(ftH, ftA, sel);
    case 'ht_1x2': return isHt1x2Hit(htH, htA, sel);
    default: return false;
  }
}

async function settleMatchById(matchId: string, ftH: number, ftA: number, htH: number, htA: number, result: JobResult): Promise<boolean> {
  const admin = createAdminClient();
  const { data: markets } = await admin.from('markets').select('id, market_type, multiplier, market_result, option_odds').eq('match_id', matchId);
  if (!markets || markets.length === 0) return false;
  let settled = false;
  for (const market of markets) {
    if (market.market_result !== 'pending') continue;
    settled = true;
    const { data: predictions } = await admin.from('predictions').select('id, user_id, selected_option, stake_points, status').eq('market_id', market.id).eq('status', 'pending');
    if (!predictions || predictions.length === 0) {
      await admin.from('markets').update({ market_result: 'void' }).eq('id', market.id);
      continue;
    }
    const optionOdds = (market.option_odds ?? {}) as Record<string, string>;
    let anyWon = false;
    for (const pred of predictions) {
      if (pred.status !== 'pending') continue;
      const hit = resolveMarketResult(market.market_type as MarketType, ftH, ftA, htH, htA, pred.selected_option);
      const effMult = optionOdds[pred.selected_option] ? parseFloat(optionOdds[pred.selected_option]) : market.multiplier;
      const payout = hit ? calcPayout(pred.stake_points, effMult) : 0;
      await admin.from('predictions').update({ status: hit ? 'won' : 'lost', payout_points: payout }).eq('id', pred.id).eq('status', 'pending');
      result.predictionsUpdatedCount++;
      if (hit && payout > 0) {
        anyWon = true;
        await adjustPoints(pred.user_id, payout, 'settle', '\u9884\u6D4B\u547D\u4E2D\u8FD4\u8FD8');
        result.pointsAwardedCount++;
      }
    }
    await admin.from('markets').update({ market_result: anyWon ? 'won' : 'lost' }).eq('id', market.id);
  }
  if (settled) {
    await admin.from('matches').update({ status: 'settled' }).eq('id', matchId);
  }
  return settled;
}

// --- Main job ---
export async function runUpdateMatchesAndSettle(): Promise<JobResult> {
  const result: JobResult = { ok: true, message: '', createdMatchesCount: 0, updatedMatchesCount: 0, settledMatchesCount: 0, lockedCount: 0, predictionsUpdatedCount: 0, pointsAwardedCount: 0, oddsBackfilledCount: 0, scoreUpdatedCount: 0, errors: [] };

  // Step 1: Fetch lazq data (fixtures + odds)
  const matches = await fetchNormalized();
  if (matches.length === 0) { result.message = 'No match data'; return result; }
  persistNormalized(matches);

  // Step 2: Fetch ESPN scores
  const espnScores = await fetchEspnScores();

  const admin = createAdminClient();

  // Step 3: Process each match from lazq
  for (const nm of matches) {
    try {
      const { data: existing } = await admin.from('matches').select('id, status, ft_home_goals, ft_away_goals').eq('external_provider', nm.externalProvider).eq('external_id', nm.externalId).maybeSingle();

      // Check if ESPN has score data for this match
      const espnKey = `${nm.homeTeam}|${nm.awayTeam}`;
      const espnScore = espnScores.get(espnKey);

      const payload: Record<string, unknown> = {
        league: '\u4E16\u754C\u676F', stage: nm.stage, home_team: nm.homeTeam, away_team: nm.awayTeam,
        start_time: nm.startTime,
        raw_status: String(nm.state), last_synced_at: new Date().toISOString(),
      };

      // Use ESPN scores if available, otherwise use lazq data
      if (espnScore) {
        payload.ft_home_goals = espnScore.homeScore;
        payload.ft_away_goals = espnScore.awayScore;
        payload.ht_home_goals = espnScore.htHome;
        payload.ht_away_goals = espnScore.htAway;
      } else {
        payload.ft_home_goals = nm.homeScore;
        payload.ft_away_goals = nm.awayScore;
        payload.ht_home_goals = nm.halfHomeScore;
        payload.ht_away_goals = nm.halfAwayScore;
      }

      if (existing) {
        // Update match data
        await admin.from('matches').update(payload).eq('id', existing.id);
        result.updatedMatchesCount++;

        // Update odds from lazq
        const { data: existingMarkets } = await admin.from('markets').select('id, market_type, option_odds').eq('match_id', existing.id);
        if (existingMarkets) {
          for (const mkt of existingMarkets) {
            const optOdds = getOptionOddsForMarket(mkt.market_type as MarketType, nm.odds);
            if (Object.keys(optOdds).length > 0) {
              await admin.from('markets').update({ option_odds: optOdds, multiplier: defaultMultiplier(optOdds, MULTIPLIER_DEFAULT[mkt.market_type as MarketType] ?? 1.8) }).eq('id', mkt.id);
              result.oddsBackfilledCount++;
            }
          }
        }

        // Auto-settle: match is finished AND has scores AND not yet settled
        const isFinished = espnScore ? true : (nm.state === -1);
        const ftH = espnScore?.homeScore ?? nm.homeScore;
        const ftA = espnScore?.awayScore ?? nm.awayScore;
        const htH = espnScore?.htHome ?? nm.halfHomeScore ?? 0;
        const htA = espnScore?.htAway ?? nm.halfAwayScore ?? 0;

        if (isFinished && existing.status !== 'settled' && ftH != null && ftA != null) {
          if (await settleMatchById(existing.id, ftH, ftA, htH, htA, result)) {
            result.settledMatchesCount++;
            try { await settleParlaysForMatch(existing.id); } catch (e) { /* parlay settle error */ }
          }
        }
      } else {
        // New match
        const { data: newMatch, error: insErr } = await admin.from('matches').insert({
          external_provider: nm.externalProvider, external_id: nm.externalId, ...payload, status: 'scheduled'
        }).select('id').single();
        if (insErr || !newMatch) { result.errors.push(`insert ${nm.externalId}: ${insErr?.message ?? 'unknown'}`); continue; }
        result.createdMatchesCount++;

        for (const def of MARKET_DEFS) {
          const optOdds = getOptionOddsForMarket(def.market_type, nm.odds);
          const mult = defaultMultiplier(optOdds, MULTIPLIER_DEFAULT[def.market_type] ?? 1.8);
          await admin.from('markets').insert({ match_id: newMatch.id, market_type: def.market_type, title: def.title, options: def.options, multiplier: mult, option_odds: optOdds, is_active: true, market_result: 'pending' });
        }

        // Auto-settle new match if already finished
        const isFinished = espnScore ? true : (nm.state === -1);
        const ftH = espnScore?.homeScore ?? nm.homeScore;
        const ftA = espnScore?.awayScore ?? nm.awayScore;
        const htH = espnScore?.htHome ?? nm.halfHomeScore ?? 0;
        const htA = espnScore?.htAway ?? nm.halfAwayScore ?? 0;

        if (isFinished && ftH != null && ftA != null) {
          if (await settleMatchById(newMatch.id, ftH, ftA, htH, htA, result)) {
            result.settledMatchesCount++;
          }
        }
      }
    } catch (e: unknown) { result.errors.push(`match ${nm.externalId}: ${e instanceof Error ? e.message : String(e)}`); }
  }

  // Delete placeholders and duplicates
  const { data: allDbMatches } = await admin.from('matches').select('id, home_team, away_team, start_time').eq('external_provider', 'lazq');
  if (allDbMatches) {
    const placeholderIds = allDbMatches.filter(m => /[\[\]\u80DC\u8005\u8D25\u8005]/.test(m.home_team) || /[\[\]\u80DC\u8005\u8D25\u8005]/.test(m.away_team)).map(m => m.id);
    if (placeholderIds.length > 0) {
      await admin.from('predictions').delete().in('match_id', placeholderIds);
      await admin.from('markets').delete().in('match_id', placeholderIds);
      await admin.from('matches').delete().in('id', placeholderIds);
    }
    const seen = new Map<string, string[]>();
    for (const m of allDbMatches) { if (placeholderIds.includes(m.id)) continue; const k = m.home_team + '|' + m.away_team + '|' + m.start_time; const ids = seen.get(k) ?? []; ids.push(m.id); seen.set(k, ids); }
    for (const [, ids] of Array.from(seen.entries())) { if (ids.length <= 1) continue; const toDelete = ids.slice(1); await admin.from('predictions').delete().in('match_id', toDelete); await admin.from('markets').delete().in('match_id', toDelete); await admin.from('matches').delete().in('id', toDelete); }
  }

  try { const lr = await autoLockMarkets(); result.lockedCount = lr.lockedCount; } catch (e: unknown) { result.errors.push(`autoLock: ${e instanceof Error ? e.message : String(e)}`); }

  result.message = [`Created: ${result.createdMatchesCount}`, `Updated: ${result.updatedMatchesCount}`, `Odds: ${result.oddsBackfilledCount}`, `Scores: ${result.scoreUpdatedCount}`, `Settled: ${result.settledMatchesCount}`, `Locked: ${result.lockedCount}`, `Preds: ${result.predictionsUpdatedCount}`, `Points: ${result.pointsAwardedCount}`, result.errors.length ? `Errors: ${result.errors.length}` : ''].filter(Boolean).join(', ');
  if (result.errors.length > 0) result.ok = false;
  return result;
}


