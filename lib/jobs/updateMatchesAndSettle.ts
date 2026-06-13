// lib/jobs/updateMatchesAndSettle.ts
// Main job: upsert matches from lazq API with per-option odds, auto-lock, auto-settle.

import { createAdminClient } from '../supabase/admin';
import { adjustPoints } from '../points';
import { MULTIPLIER_DEFAULT } from '../constants';
import { fetchWorldCupFixtures } from '../lazq';
import {
  is1x2Hit, isExactScoreHit, isTotalGoalsHit, isBttsHit, isHt1x2Hit, calcPayout,
} from '../markets';
import { autoLockMarkets } from './lock';
import { normalizeFromApiResponse, persistNormalized, loadNormalizedFromFile, type NormalizedMatch } from '../data-providers/lazqNormalize';
import type { MarketType } from '../../types/database';
import type { ExtractedOdds } from '../data-providers/lazqOddsExtractor';

export interface JobResult {
  ok: boolean;
  message: string;
  createdMatchesCount: number;
  updatedMatchesCount: number;
  settledMatchesCount: number;
  lockedCount: number;
  predictionsUpdatedCount: number;
  pointsAwardedCount: number;
  errors: string[];
}

const MARKET_DEFS: { market_type: MarketType; title: string; options: string[] }[] = [
  { market_type: '1x2', title: '胜平负', options: ['home', 'draw', 'away'] },
  {
    market_type: 'exact_score', title: '准确比分',
    options: ['0-0','1-0','0-1','1-1','2-0','0-2','2-1','1-2','2-2','3-0','0-3','3-1','1-3','3-2','2-3','other'],
  },
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
  if (values.length === 0) return fallback;
  return Math.min(...values);
}

async function fetchNormalizedFromLazqApi(): Promise<NormalizedMatch[]> {
  const resp = await fetchWorldCupFixtures(2026);
  // Use 'as unknown as' to bridge between typed LazqFixturesResponse and flexible normalize function
  return normalizeFromApiResponse(resp as unknown as Parameters<typeof normalizeFromApiResponse>[0]);
}

/* ---------- Settlement logic ---------- */

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
  const ftH = nm.homeScore!, ftA = nm.awayScore!, htH = nm.halfHomeScore ?? 0, htA = nm.halfAwayScore ?? 0;

  const { data: markets } = await admin.from('markets').select('id, market_type, multiplier, market_result, option_odds').eq('match_id', matchId);
  if (!markets || markets.length === 0) return false;

  for (const market of markets) {
    if (market.market_result !== 'pending') continue;
    const { data: predictions } = await admin.from('predictions').select('id, user_id, selected_option, stake_points, status').eq('market_id', market.id).eq('status', 'pending');
    if (!predictions || predictions.length === 0) {
      await admin.from('markets').update({ market_result: 'void' }).eq('id', market.id);
      continue;
    }
    let anyWon = false;
    const optionOdds = (market.option_odds ?? {}) as Record<string, string>;
    for (const pred of predictions) {
      if (pred.status !== 'pending') continue;
      const hit = resolveMarketResult(market.market_type as MarketType, ftH, ftA, htH, htA, pred.selected_option);
      const optOdds = optionOdds[pred.selected_option];
      const effectiveMultiplier = optOdds ? parseFloat(optOdds) : market.multiplier;
      const payout = hit ? calcPayout(pred.stake_points, effectiveMultiplier) : 0;
      const { error: updErr } = await admin.from('predictions').update({ status: hit ? 'won' : 'lost', payout_points: payout }).eq('id', pred.id).eq('status', 'pending');
      if (updErr) { result.errors.push(`update prediction ${pred.id}: ${updErr.message}`); continue; }
      result.predictionsUpdatedCount++;
      if (hit && payout > 0) {
        anyWon = true;
        try { await adjustPoints(pred.user_id, payout, '命中返还', pred.id); result.pointsAwardedCount++; }
        catch (e: unknown) { result.errors.push(`award points ${pred.user_id}: ${e instanceof Error ? e.message : String(e)}`); }
      }
    }
    await admin.from('markets').update({ market_result: anyWon ? 'won' : 'lost' }).eq('id', market.id);
  }

  const { error: settleErr } = await admin.from('matches').update({ status: 'settled' }).eq('id', matchId);
  if (settleErr) { result.errors.push(`settle match ${matchId}: ${settleErr.message}`); return false; }
  return true;
}

/* ---------- Main entry ---------- */

export async function runUpdateMatchesAndSettle(): Promise<JobResult> {
  const result: JobResult = { ok: true, message: '', createdMatchesCount: 0, updatedMatchesCount: 0, settledMatchesCount: 0, lockedCount: 0, predictionsUpdatedCount: 0, pointsAwardedCount: 0, errors: [] };

  let matches: NormalizedMatch[] | null = null;
  try { matches = await fetchNormalizedFromLazqApi(); console.log(`Fetched ${matches.length} matches from lazq API`); }
  catch (e: unknown) { console.log(`lazq API failed (${e instanceof Error ? e.message : String(e)}), trying local file...`); matches = loadNormalizedFromFile(); }

  if (!matches || matches.length === 0) { result.message = 'No match data available'; return result; }

  persistNormalized(matches);

  const admin = createAdminClient();

  for (const nm of matches) {
    try {
      const { data: existing } = await admin.from('matches').select('id, status').eq('external_provider', nm.externalProvider).eq('external_id', nm.externalId).maybeSingle();

      const payload: Record<string, unknown> = {
        league: '世界杯', stage: nm.stage,
        home_team: nm.homeTeam, away_team: nm.awayTeam, start_time: nm.startTime,
        ft_home_goals: nm.homeScore, ft_away_goals: nm.awayScore,
        ht_home_goals: nm.halfHomeScore, ht_away_goals: nm.halfAwayScore,
        raw_status: String(nm.state), last_synced_at: new Date().toISOString(),
      };

      if (existing) {
        const { error: updErr } = await admin.from('matches').update(payload).eq('id', existing.id);
        if (updErr) { result.errors.push(`update ${nm.externalId}: ${updErr.message}`); continue; }
        result.updatedMatchesCount++;
        // Update existing markets' option_odds
        const { data: existingMarkets } = await admin.from('markets').select('id, market_type').eq('match_id', existing.id);
        if (existingMarkets) {
          for (const mkt of existingMarkets) {
            const optOdds = getOptionOddsForMarket(mkt.market_type as MarketType, nm.odds);
            if (Object.keys(optOdds).length > 0) {
              await admin.from('markets').update({ option_odds: optOdds }).eq('id', mkt.id);
            }
          }
        }
        if (nm.state === -1 && existing.status !== 'settled' && nm.homeScore != null && nm.awayScore != null) {
          if (await settleMatchById(existing.id, nm, result)) result.settledMatchesCount++;
        }
      } else {
        const { data: newMatch, error: insErr } = await admin.from('matches').insert({
          external_provider: nm.externalProvider, external_id: nm.externalId,
          ...payload, status: 'scheduled',
        }).select('id').single();
        if (insErr || !newMatch) { result.errors.push(`insert ${nm.externalId}: ${insErr?.message ?? 'unknown'}`); continue; }
        result.createdMatchesCount++;
        for (const def of MARKET_DEFS) {
          const optOdds = getOptionOddsForMarket(def.market_type, nm.odds);
          const mult = defaultMultiplier(optOdds, MULTIPLIER_DEFAULT[def.market_type] ?? 1.8);
          await admin.from('markets').insert({
            match_id: newMatch.id, market_type: def.market_type, title: def.title,
            options: def.options, multiplier: mult,
            option_odds: optOdds,
            is_active: true, market_result: 'pending',
          });
        }
        if (nm.state === -1 && nm.homeScore != null && nm.awayScore != null) {
          if (await settleMatchById(newMatch.id, nm, result)) result.settledMatchesCount++;
        }
      }
    } catch (e: unknown) { result.errors.push(`match ${nm.externalId}: ${e instanceof Error ? e.message : String(e)}`); }
  }

  try { const lr = await autoLockMarkets(); result.lockedCount = lr.lockedCount; }
  catch (e: unknown) { result.errors.push(`autoLock: ${e instanceof Error ? e.message : String(e)}`); }

  result.message = [`Created: ${result.createdMatchesCount}`, `Updated: ${result.updatedMatchesCount}`, `Settled: ${result.settledMatchesCount}`, `Locked: ${result.lockedCount}`, `Preds: ${result.predictionsUpdatedCount}`, `Points: ${result.pointsAwardedCount}`, result.errors.length ? `Errors: ${result.errors.length}` : ''].filter(Boolean).join(', ');
  if (result.errors.length > 0) result.ok = false;
  return result;
}