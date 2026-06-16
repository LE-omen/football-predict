// lib/jobs/updateMatchesAndSettle.ts
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
import type { MarketType } from '../../types/database';

export interface JobResult {
  ok: boolean; message: string;
  createdMatchesCount: number; updatedMatchesCount: number; settledMatchesCount: number;
  lockedCount: number; predictionsUpdatedCount: number; pointsAwardedCount: number;
  oddsBackfilledCount: number; errors: string[];
}

const MARKET_DEFS: { market_type: MarketType; title: string; options: string[] }[] = [
  { market_type: '1x2', title: '胜平负', options: ['home', 'draw', 'away'] },
  { market_type: 'exact_score', title: '准确比分', options: ['0-0','1-0','0-1','1-1','2-0','0-2','2-1','1-2','2-2','3-0','0-3','3-1','1-3','3-2','2-3','other_home','other_draw','other_away'] },
  { market_type: 'total_goals', title: '总进球', options: ['0','1','2','3','4','5','6','7+'] },
  { market_type: 'btts', title: '双方是否进球', options: ['yes', 'no'] },
  { market_type: 'ht_1x2', title: '半场胜平负', options: ['home', 'draw', 'away'] },
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
  return /[\[\]胜者败者]/.test(nm.homeTeam) || /[\[\]胜者败者]/.test(nm.awayTeam);
}

interface ScraperData {
  oddsMap: Map<string, ExtractedOdds>;
  scoreMap: Map<string, { homeScore: number | null; awayScore: number | null; halfHomeScore: number | null; halfAwayScore: number | null; state: number }>;
}

function loadScraperData(): ScraperData {
  const oddsMap = new Map<string, ExtractedOdds>();
  const scoreMap = new Map<string, { homeScore: number | null; awayScore: number | null; halfHomeScore: number | null; halfAwayScore: number | null; state: number }>();
  const rawDir = path.resolve(process.cwd(), 'data/raw/lazq');
  if (!fs.existsSync(rawDir)) return { oddsMap, scoreMap };
  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.json')).sort().reverse();
  if (files.length === 0) return { oddsMap, scoreMap };
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(rawDir, files[0]), 'utf-8'));
    const items = (Array.isArray(raw) ? raw : [raw]).flatMap((r: any) => Array.isArray(r?.data) ? r.data : []);
    for (const item of items) {
      if (!item?.homeTeamName || !item?.awayTeamName) continue;
      const key = item.homeTeamName + '|' + item.awayTeamName;
      oddsMap.set(key, extractOdds(item));
      scoreMap.set(key, {
        homeScore: item.homeScore ? parseInt(item.homeScore) : null,
        awayScore: item.awayScore ? parseInt(item.awayScore) : null,
        halfHomeScore: item.homeHalfScore ? parseInt(item.homeHalfScore) : null,
        halfAwayScore: item.awayHalfScore ? parseInt(item.awayHalfScore) : null,
        state: typeof item.state === 'number' ? item.state : 0,
      });
    }
    console.log(`Loaded scraper data for ${oddsMap.size} matches`);
  } catch (e) { console.log(`Scraper load error: ${e instanceof Error ? e.message : String(e)}`); }
  return { oddsMap, scoreMap };
}

async function fetchNormalized(): Promise<NormalizedMatch[]> {
  let apiMatches: NormalizedMatch[] = [];
  try {
    const resp = await fetchWorldCupFixtures(2026);
    apiMatches = normalizeFromApiResponse(resp as any);
  } catch (e) { console.log(`API failed (${e instanceof Error ? e.message : String(e)}), using local file`); apiMatches = loadNormalizedFromFile() ?? []; }
  if (apiMatches.length === 0) return [];

  const { oddsMap, scoreMap } = loadScraperData();

  return apiMatches.filter(m => !isPlaceholderMatch(m)).map(m => {
    const key = m.homeTeam + '|' + m.awayTeam;
    const sOdds = oddsMap.get(key);
    if (sOdds) {
      for (const k of ['1x2', 'exact_score', 'total_goals', 'btts', 'ht_1x2'] as const) {
        if (Object.keys(sOdds[k]).length > 0) m.odds[k] = { ...sOdds[k] };
      }
    }
    const sScore = scoreMap.get(key);
    if (sScore) {
      if (m.homeScore == null && sScore.homeScore != null) m.homeScore = sScore.homeScore;
      if (m.awayScore == null && sScore.awayScore != null) m.awayScore = sScore.awayScore;
      if (m.halfHomeScore == null && sScore.halfHomeScore != null) m.halfHomeScore = sScore.halfHomeScore;
      if (m.halfAwayScore == null && sScore.halfAwayScore != null) m.halfAwayScore = sScore.halfAwayScore;
      if (m.state !== -1 && sScore.state === -1) m.state = sScore.state;
    }
    return m;
  });
}

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

async function settleMatchById(matchId: string, nm: NormalizedMatch, result: JobResult): Promise<boolean> {
  const admin = createAdminClient();
  const ftH = nm.homeScore!, ftA = nm.awayScore!;
  const htH = nm.halfHomeScore ?? 0, htA = nm.halfAwayScore ?? 0;
  const { data: markets } = await admin.from('markets').select('id, market_type, multiplier, market_result, option_odds').eq('match_id', matchId);
  if (!markets || markets.length === 0) return false;
  for (const market of markets) {
    if (market.market_result !== 'pending') continue;
    const { data: predictions } = await admin.from('predictions').select('id, user_id, selected_option, stake_points, status').eq('market_id', market.id).eq('status', 'pending');
    if (!predictions || predictions.length === 0) { await admin.from('markets').update({ market_result: 'void' }).eq('id', market.id); continue; }
    const optionOdds = (market.option_odds ?? {}) as Record<string, string>;
    let anyWon = false;
    for (const pred of predictions) {
      if (pred.status !== 'pending') continue;
      const hit = resolveMarketResult(market.market_type as MarketType, ftH, ftA, htH, htA, pred.selected_option);
      const effMult = optionOdds[pred.selected_option] ? parseFloat(optionOdds[pred.selected_option]) : market.multiplier;
      const payout = hit ? calcPayout(pred.stake_points, effMult) : 0;
      await admin.from('predictions').update({ status: hit ? 'won' : 'lost', payout_points: payout }).eq('id', pred.id).eq('status', 'pending');
      result.predictionsUpdatedCount++;
      if (hit && payout > 0) { anyWon = true; await adjustPoints(pred.user_id, payout, 'settle', '预测命中返还'); result.pointsAwardedCount++; }
    }
    await admin.from('markets').update({ market_result: anyWon ? 'won' : 'lost' }).eq('id', market.id);
  }
  await admin.from('matches').update({ status: 'settled' }).eq('id', matchId);
  return true;
}

export async function runUpdateMatchesAndSettle(): Promise<JobResult> {
  const result: JobResult = { ok: true, message: '', createdMatchesCount: 0, updatedMatchesCount: 0, settledMatchesCount: 0, lockedCount: 0, predictionsUpdatedCount: 0, pointsAwardedCount: 0, oddsBackfilledCount: 0, errors: [] };

  const matches = await fetchNormalized();
  if (matches.length === 0) { result.message = 'No match data'; return result; }
  persistNormalized(matches);

  const admin = createAdminClient();
  for (const nm of matches) {
    try {
      const { data: existing } = await admin.from('matches').select('id, status').eq('external_provider', nm.externalProvider).eq('external_id', nm.externalId).maybeSingle();
      const payload: Record<string, unknown> = {
        league: '世界杯', stage: nm.stage, home_team: nm.homeTeam, away_team: nm.awayTeam,
        start_time: nm.startTime, ft_home_goals: nm.homeScore, ft_away_goals: nm.awayScore,
        ht_home_goals: nm.halfHomeScore, ht_away_goals: nm.halfAwayScore,
        raw_status: String(nm.state), last_synced_at: new Date().toISOString(),
      };
      if (existing) {
        await admin.from('matches').update(payload).eq('id', existing.id);
        result.updatedMatchesCount++;
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
        if (nm.state === -1 && existing.status !== 'settled' && nm.homeScore != null && nm.awayScore != null) {
          if (await settleMatchById(existing.id, nm, result)) result.settledMatchesCount++;
        }
      } else {
        const { data: newMatch, error: insErr } = await admin.from('matches').insert({ external_provider: nm.externalProvider, external_id: nm.externalId, ...payload, status: 'scheduled' }).select('id').single();
        if (insErr || !newMatch) { result.errors.push(`insert ${nm.externalId}: ${insErr?.message ?? 'unknown'}`); continue; }
        result.createdMatchesCount++;
        for (const def of MARKET_DEFS) {
          const optOdds = getOptionOddsForMarket(def.market_type, nm.odds);
          const mult = defaultMultiplier(optOdds, MULTIPLIER_DEFAULT[def.market_type] ?? 1.8);
          await admin.from('markets').insert({ match_id: newMatch.id, market_type: def.market_type, title: def.title, options: def.options, multiplier: mult, option_odds: optOdds, is_active: true, market_result: 'pending' });
        }
        if (nm.state === -1 && nm.homeScore != null && nm.awayScore != null) {
          if (await settleMatchById(newMatch.id, nm, result)) result.settledMatchesCount++;
        }
      }
    } catch (e: unknown) { result.errors.push(`match ${nm.externalId}: ${e instanceof Error ? e.message : String(e)}`); }
  }

  // Delete placeholders and duplicates
  const { data: allDbMatches } = await admin.from('matches').select('id, home_team, away_team, start_time').eq('external_provider', 'lazq');
  if (allDbMatches) {
    const placeholderIds = allDbMatches.filter(m => /[\[\]胜者败者]/.test(m.home_team) || /[\[\]胜者败者]/.test(m.away_team)).map(m => m.id);
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

  result.message = [`Created: ${result.createdMatchesCount}`, `Updated: ${result.updatedMatchesCount}`, `Odds: ${result.oddsBackfilledCount}`, `Settled: ${result.settledMatchesCount}`, `Locked: ${result.lockedCount}`, `Preds: ${result.predictionsUpdatedCount}`, `Points: ${result.pointsAwardedCount}`, result.errors.length ? `Errors: ${result.errors.length}` : ''].filter(Boolean).join(', ');
  if (result.errors.length > 0) result.ok = false;
  return result;
}
