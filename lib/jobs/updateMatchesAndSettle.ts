// lib/jobs/updateMatchesAndSettle.ts
// 数据流（只处理赛程同步，不处理赔率和比分结算）：
//   1. lazq API -> 赛程数据（不处理赔率）
//   2. 创建/更新比赛记录
//   3. 自动锁定即将开赛的比赛

import { createAdminClient } from '../supabase/admin';
import { MULTIPLIER_DEFAULT } from '../constants';
import { fetchWorldCupFixtures } from '../lazq';
import { autoLockMarkets } from './lock';
import { normalizeFromApiResponse, type NormalizedMatch } from '../data-providers/lazqNormalize';
import type { MarketType } from '../../types/database';

export interface JobResult {
  ok: boolean; message: string;
  createdMatchesCount: number; updatedMatchesCount: number; settledMatchesCount: number;
  lockedCount: number; predictionsUpdatedCount: number; pointsAwardedCount: number;
  oddsBackfilledCount: number; scoreUpdatedCount: number; errors: string[];
}

const MARKET_DEFS: { market_type: MarketType; title: string; options: string[] }[] = [
  { market_type: '1x2', title: '胜平负', options: ['home', 'draw', 'away'] },
  { market_type: 'exact_score', title: '准确比分', options: ['0-0','1-0','0-1','1-1','2-0','0-2','2-1','1-2','2-2','3-0','0-3','3-1','1-3','3-2','2-3','other_home','other_draw','other_away'] },
  { market_type: 'total_goals', title: '总进球', options: ['0','1','2','3','4','5','6','7+'] },
  { market_type: 'btts', title: '双方是否进球', options: ['yes', 'no'] },
  { market_type: 'ht_1x2', title: '半场胜平负', options: ['home', 'draw', 'away'] },
];

function defaultMultiplier(fallback: number): number {
  return fallback;
}

function isPlaceholderMatch(nm: NormalizedMatch): boolean {
  return /[\[\]\u80DC\u8005\u8D25\u8005]/.test(nm.homeTeam) || /[\[\]\u80DC\u8005\u8D25\u8005]/.test(nm.awayTeam);
}

// --- Main job ---
export async function runUpdateMatchesAndSettle(): Promise<JobResult> {
  const result: JobResult = { ok: true, message: '', createdMatchesCount: 0, updatedMatchesCount: 0, settledMatchesCount: 0, lockedCount: 0, predictionsUpdatedCount: 0, pointsAwardedCount: 0, oddsBackfilledCount: 0, scoreUpdatedCount: 0, errors: [] };

  // Step 1: Fetch lazq data (只同步赛程，不处理赔率)
  let apiMatches: NormalizedMatch[] = [];
  try {
    const apiResp = await fetchWorldCupFixtures(2026);
    apiMatches = normalizeFromApiResponse(apiResp as any);
  } catch (e) { console.log(`lazq API failed (${e instanceof Error ? e.message : String(e)})`); }
  if (apiMatches.length === 0) { result.message = 'No match data'; return result; }

  const admin = createAdminClient();

  // Step 2: Process each match (只创建/更新比赛，不处理赔率和比分)
  for (const nm of apiMatches) {
    try {
      if (isPlaceholderMatch(nm)) continue;

      const { data: existing } = await admin.from('matches').select('id, status').eq('external_provider', nm.externalProvider).eq('external_id', nm.externalId).maybeSingle();

      const payload: Record<string, unknown> = {
        league: '世界杯', stage: nm.stage, home_team: nm.homeTeam, away_team: nm.awayTeam,
        start_time: nm.startTime,
        raw_status: String(nm.state), last_synced_at: new Date().toISOString(),
      };

      if (existing) {
        await admin.from('matches').update(payload).eq('id', existing.id);
        result.updatedMatchesCount++;
      } else {
        const { data: newMatch, error: insErr } = await admin.from('matches').insert({
          external_provider: nm.externalProvider, external_id: nm.externalId, ...payload, status: 'scheduled'
        }).select('id').single();
        if (insErr || !newMatch) { result.errors.push(`insert ${nm.externalId}: ${insErr?.message ?? 'unknown'}`); continue; }
        result.createdMatchesCount++;

        // 创建 markets（使用默认倍率，赔率由 GitHub Actions 独立同步）
        for (const def of MARKET_DEFS) {
          const mult = MULTIPLIER_DEFAULT[def.market_type] ?? 1.8;
          await admin.from('markets').insert({ match_id: newMatch.id, market_type: def.market_type, title: def.title, options: def.options, multiplier: mult, option_odds: {}, is_active: true, market_result: 'pending' });
        }
      }
    } catch (e: unknown) { result.errors.push(`match ${nm.externalId}: ${e instanceof Error ? e.message : String(e)}`); }
  }

  // Step 3: 清理占位符和重复数据
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

  // Step 4: 自动锁定即将开赛的比赛
  try { const lr = await autoLockMarkets(); result.lockedCount = lr.lockedCount; } catch (e: unknown) { result.errors.push(`autoLock: ${e instanceof Error ? e.message : String(e)}`); }

  result.message = [`Created: ${result.createdMatchesCount}`, `Updated: ${result.updatedMatchesCount}`, `Locked: ${result.lockedCount}`, result.errors.length ? `Errors: ${result.errors.length}` : ''].filter(Boolean).join(', ');
  if (result.errors.length > 0) result.ok = false;
  return result;
}
