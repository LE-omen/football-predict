// lib/jobs/updateMatchesAndSettle.ts
// Main job: upsert matches from lazq API, auto-lock, auto-settle finished matches.

import * as fs from 'fs';
import * as path from 'path';
import { createAdminClient } from '../supabase/admin';
import { adjustPoints } from '../points';
import { MULTIPLIER_DEFAULT } from '../constants';
import { fetchWorldCupFixtures } from '../lazq';
import {
  is1x2Hit, isExactScoreHit, isTotalGoalsHit, isBttsHit, isHt1x2Hit, calcPayout,
} from '../markets';
import { autoLockMarkets } from './lock';
import type { NormalizedMatch } from '../data-providers/lazqNormalize';
import type { MarketType } from '../../types/database';

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
  { market_type: 'total_goals', title: '总进球', options: ['over2.5', 'under2.5'] },
  { market_type: 'btts', title: '双方是否进球', options: ['yes', 'no'] },
  { market_type: 'ht_1x2', title: '半场胜平负', options: ['home', 'draw', 'away'] },
];

type TeamEntry = [number, string, string];

function parseScore(val: string | null | undefined): number | null {
  if (val === '' || val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

/** Fetch from lazq API and deduplicate by externalId */
async function fetchNormalizedFromLazqApi(): Promise<NormalizedMatch[]> {
  const resp = await fetchWorldCupFixtures(2026);
  const { teams, matches, kinds } = resp.data;

  const teamMap = new Map<string, string>();
  for (const entry of Object.values(teams) as TeamEntry[]) {
    teamMap.set(String(entry[0]), entry[1]);
  }
  const roundMap = new Map(kinds.map(k => [k[0], k[1]]));

  const seen = new Set<string>();
  const result: NormalizedMatch[] = [];

  for (const [roundKey, roundMatches] of Object.entries(matches)) {
    const roundIdMatch = roundKey.match(/G(\d+)/);
    const roundId = roundIdMatch ? Number(roundIdMatch[1]) : 0;
    const roundName = roundMap.get(roundId) ?? '小组赛';

    for (const m of roundMatches) {
      const extId = String(m.id);
      // Skip if already processed (same match can appear in multiple rounds)
      if (seen.has(extId)) continue;
      seen.add(extId);

      const homeName = teamMap.get(String(m.h)) ?? `Team#${m.h}`;
      const awayName = teamMap.get(String(m.a)) ?? `Team#${m.a}`;
      const startTime = new Date(m.t * 1000).toISOString();

      result.push({
        externalProvider: 'lazq',
        externalId: extId,
        homeTeam: homeName,
        awayTeam: awayName,
        startTime,
        stage: roundName,
        homeScore: parseScore(m.sc[0]),
        awayScore: parseScore(m.sc[1]),
        halfHomeScore: parseScore(m.sc[2]),
        halfAwayScore: parseScore(m.sc[3]),
        state: m.s,
        rawJson: m,
      });
    }
  }

  return result;
}

function loadNormalizedFromFile(): NormalizedMatch[] | null {
  const filePath = path.join(process.cwd(), 'data', 'normalized', 'lazq-matches.json');
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as NormalizedMatch[];
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

  const { data: markets } = await admin.from('markets').select('id, market_type, multiplier, market_result').eq('match_id', matchId);
  if (!markets || markets.length === 0) return false;

  for (const market of markets) {
    if (market.market_result !== 'pending') continue;
    const { data: predictions } = await admin.from('predictions').select('id, user_id, selected_option, stake_points, status').eq('market_id', market.id).eq('status', 'pending');
    if (!predictions || predictions.length === 0) {
      await admin.from('markets').update({ market_result: 'void' }).eq('id', market.id);
      continue;
    }
    let anyWon = false;
    for (const pred of predictions) {
      if (pred.status !== 'pending') continue;
      const hit = resolveMarketResult(market.market_type as MarketType, ftH, ftA, htH, htA, pred.selected_option);
      const payout = hit ? calcPayout(pred.stake_points, market.multiplier) : 0;
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
          await admin.from('markets').insert({
            match_id: newMatch.id, market_type: def.market_type, title: def.title,
            options: def.options, multiplier: MULTIPLIER_DEFAULT[def.market_type] ?? 1.8,
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