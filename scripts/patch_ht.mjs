import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
const root = process.cwd();
function w(rel, content) {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
  console.log('OK', rel);
}

// === SQL migration ===
w('sql/009_remove_ht_enforce_concurrency.sql', `-- 009_remove_ht_enforce_concurrency.sql
begin;
delete from public.markets where market_type::text = 'ht_1x2';
alter table public.matches drop column if exists ht_home_goals;
alter table public.matches drop column if exists ht_away_goals;
alter table public.predictions alter column created_at set default now();
create unique index if not exists ux_predictions_user_market_option_pending
on public.predictions(user_id, market_id, selected_option) where status = 'pending';
alter table public.users add column if not exists nickname_changed boolean not null default false;
commit;
`);

// === lib/constants.ts ===
w('lib/constants.ts', `// lib/constants.ts
export const APP_NAME = '\u8DB3\u7403\u91D1\u5E01\u9884\u6D4B';
export const POINTS_INITIAL = 10000;
export const STAKE_MIN = 100;
export const STAKE_MAX = Number(process.env.STAKE_MAX ?? 999999);
export const STAKE_STEP = 100;
export const LOCK_MINUTES_BEFORE_KICKOFF = Number(process.env.MATCH_LOCK_MINUTES ?? 30);
export const ENABLE_LOCK_WINDOW = String(process.env.ENABLE_LOCK_WINDOW ?? 'true') === 'true';
export const RELIEF_AMOUNT = 1000;
export const RELIEF_MAX_PER_DAY = 3;
export const RELIEF_MIN_POINTS = 100;
export const MULTIPLIER_DEFAULT: Record<string, number> = {
  '1x2': 1.80,
  exact_score: 7.00,
  total_goals: 1.90,
  btts: 1.85,
};
`);

// === types/database.ts ===
w('types/database.ts', `// types/database.ts
export type UserRole = 'user' | 'admin';
export type MatchStatus = 'scheduled' | 'locked' | 'settled' | 'canceled';
export type MarketType = '1x2' | 'exact_score' | 'total_goals' | 'btts';
export type MarketResultStatus = 'pending' | 'won' | 'lost' | 'void';
export interface UserRow {
  id: string; nickname: string; password_hash: string; role: UserRole; points: number;
  created_at: string; updated_at: string; nickname_changed?: boolean;
}
export interface InviteCodeRow {
  id: string; code: string; created_by: string | null; is_active: boolean;
  used_by: string | null; used_at: string | null; created_at: string; updated_at: string;
}
export interface MatchRow {
  id: string; league: string | null; stage: string | null; home_team: string; away_team: string;
  start_time: string; status: MatchStatus; ft_home_goals: number | null; ft_away_goals: number | null;
  created_at: string; updated_at: string; api_football_fixture_id: number | null;
  api_football_league_id: number | null; api_football_season: number | null;
  venue: string | null; raw_status: string | null; last_synced_at: string | null;
  external_provider: string | null; external_id: string | null; lock_time: string | null;
}
export interface MarketRow {
  id: string; match_id: string; market_type: MarketType; title: string; options: string[];
  multiplier: number; is_active: boolean; market_result: MarketResultStatus;
  created_at: string; updated_at: string;
}
export interface PredictionRow {
  id: string; user_id: string; match_id: string; market_id: string; selected_option: string;
  stake_points: number; status: MarketResultStatus; payout_points: number;
  created_at: string; updated_at: string;
}
export interface ReliefLogRow {
  id: string; user_id: string; amount: number; created_at: string; created_date: string;
}
export interface PointTransactionRow {
  id: string; user_id: string; amount: number; reason: string; ref_id: string | null; created_at: string;
}
export interface ApiSyncLogRow {
  id: string; sync_type: string; status: string; detail: Record<string, unknown> | null; created_at: string;
}
export interface ExternalOddsRawRow {
  id: string; fixture_id: number; bookmaker_name: string | null; bet_key: string;
  bet_label: string | null; values_json: unknown[]; synced_at: string;
}
`);

// === types/market.ts ===
w('types/market.ts', `// types/market.ts
import type { MarketRow, MarketType } from './database';
export interface MarketItem {
  id: string; match_id: string; market_type: MarketType; title: string; options: string[];
  multiplier: number; is_active: boolean; market_result: string; option_odds?: Record<string, string>;
}
export const marketTypeLabel: Record<MarketType, string> = {
  '1x2': '\u80DC\u5E73\u8D1F', exact_score: '\u51C6\u786E\u6BD4\u5206',
  total_goals: '\u603B\u8FDB\u7403', btts: '\u53CC\u65B9\u662F\u5426\u8FDB\u7403',
};
export const marketOptionLabel: Record<string, string> = {
  home: '\u4E3B\u80DC', draw: '\u5E73', away: '\u5BA2\u80DC', yes: '\u662F', no: '\u5426',
  'over2.5': '\u5927\u4E8E 2.5', 'under2.5': '\u5C0F\u4E8E 2.5',
  '0': '0\u7403', '1': '1\u7403', '2': '2\u7403', '3': '3\u7403', '4': '4\u7403', '5': '5\u7403', '6': '6\u7403', '7+': '7+\u7403',
  other_home: '\u80DC\u5176\u4ED6', other_draw: '\u5E73\u5176\u4ED6', other_away: '\u8D1F\u5176\u4ED6',
};
export function getOptionLabel(value: string): string { return marketOptionLabel[value] ?? value; }
`);

// === types/match.ts ===
w('types/match.ts', `// types/match.ts
import type { MatchRow, MatchStatus } from './database';
export type MatchItem = Pick<MatchRow,
  'id' | 'league' | 'stage' | 'home_team' | 'away_team' | 'start_time' | 'status' |
  'ft_home_goals' | 'ft_away_goals' | 'venue' | 'raw_status' | 'api_football_fixture_id' | 'last_synced_at'
>;
export type MatchListQuery = { status?: MatchStatus; limit?: number; offset?: number; };
`);

// === lib/markets.ts ===
w('lib/markets.ts', `// lib/markets.ts
import type { MarketType } from '../types/database';
import type { MarketItem } from '../types/market';

export function isOptionValidForMarket(market: MarketItem, option: string) {
  return market.options.includes(option);
}

export function displayOption(_marketType: MarketType, option: string) { return option; }

export function calcPayout(stake: number, multiplier: number): number {
  return Math.round(stake * multiplier);
}

export function getEffectiveMultiplier(
  market: { multiplier: number; option_odds?: Record<string, string> | null },
  selectedOption: string,
): number {
  const odds = market.option_odds;
  if (odds && odds[selectedOption]) {
    const val = parseFloat(odds[selectedOption]);
    if (!isNaN(val) && val > 0) return val;
  }
  return market.multiplier;
}

export function isExactScoreHit(ftHome: number, ftAway: number, selected: string) {
  if (selected === 'other_home') return ftHome > ftAway && ftHome >= 4;
  if (selected === 'other_draw') return ftHome === ftAway && ftHome >= 4;
  if (selected === 'other_away') return ftAway > ftHome && ftAway >= 4;
  const [h, a] = selected.split('-').map(Number);
  return h === ftHome && a === ftAway;
}

export function is1x2Hit(ftHome: number, ftAway: number, selected: string) {
  if (ftHome === ftAway) return selected === 'draw';
  if (ftHome > ftAway) return selected === 'home';
  return selected === 'away';
}

export function isTotalGoalsHit(ftHome: number, ftAway: number, selected: string) {
  const total = ftHome + ftAway;
  if (selected === '7+') return total >= 7;
  return total === parseInt(selected);
}

export function isBttsHit(ftHome: number, ftAway: number, selected: string) {
  const both = ftHome > 0 && ftAway > 0;
  return selected === (both ? 'yes' : 'no');
}
`);

// === lib/validators.ts ===
w('lib/validators.ts', `// lib/validators.ts
import { STAKE_MIN, STAKE_MAX } from './constants';
export function isValidStake(value: number) {
  if (!Number.isFinite(value)) return false;
  if (value < STAKE_MIN || value > STAKE_MAX) return false;
  if (value % 100 !== 0) return false;
  return true;
}
export function isValidNickname(nickname: string) {
  return typeof nickname === 'string' && nickname.trim().length >= 2 && nickname.trim().length <= 24;
}
export function isValidPassword(password: string) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 72;
}
export function isValidInviteCode(code: string) {
  return typeof code === 'string' && code.trim().length >= 1 && code.trim().length <= 64;
}
`);

// === lib/settlement.ts ===
w('lib/settlement.ts', `// lib/settlement.ts
import { createAdminClient } from './supabase/admin';
import { is1x2Hit, isExactScoreHit, isTotalGoalsHit, isBttsHit, calcPayout, getEffectiveMultiplier } from './markets';
import { adjustPoints } from './points';

export async function settleMatch(matchId: string) {
  const admin = createAdminClient();
  const { data: match, error: matchErr } = await admin.from('matches').select('*').eq('id', matchId).single();
  if (matchErr || !match) throw new Error('match not found');
  if (match.status === 'settled') throw new Error('already settled');
  if (match.ft_home_goals == null || match.ft_away_goals == null) throw new Error('set FT score first');

  const { data: markets } = await admin.from('markets').select('*').eq('match_id', matchId);
  if (!markets || markets.length === 0) throw new Error('no markets');

  for (const market of markets) {
    const { data: preds } = await admin.from('predictions').select('*').eq('market_id', market.id);
    if (!preds || preds.length === 0) {
      await admin.from('markets').update({ market_result: 'void' }).eq('id', market.id);
      continue;
    }
    let anyWon = false;
    for (const pred of preds) {
      const hit = isMarketHit(market.market_type, {
        ftHome: match.ft_home_goals, ftAway: match.ft_away_goals, selected: pred.selected_option,
      });
      const effectiveMult = getEffectiveMultiplier(market, pred.selected_option);
      const payout = hit ? calcPayout(pred.stake_points, effectiveMult) : 0;
      const status = hit ? 'won' : 'lost';
      await admin.from('predictions').update({ status, payout_points: payout }).eq('id', pred.id);
      if (hit && payout > 0) { anyWon = true; await adjustPoints(pred.user_id, payout, '\u547D\u4E2D\u8FD4\u8FD8', pred.id); }
    }
    await admin.from('markets').update({ market_result: anyWon ? 'won' : 'lost' }).eq('id', market.id);
  }
  await admin.from('matches').update({ status: 'settled' }).eq('id', matchId);
  return { ok: true };
}

function isMarketHit(marketType: string, args: { ftHome: number; ftAway: number; selected: string }) {
  switch (marketType) {
    case '1x2': return is1x2Hit(args.ftHome, args.ftAway, args.selected);
    case 'exact_score': return isExactScoreHit(args.ftHome, args.ftAway, args.selected);
    case 'total_goals': return isTotalGoalsHit(args.ftHome, args.ftAway, args.selected);
    case 'btts': return isBttsHit(args.ftHome, args.ftAway, args.selected);
    default: return false;
  }
}
`);

// === lib/parlaySettle.ts ===
w('lib/parlaySettle.ts', `// lib/parlaySettle.ts
import { createAdminClient } from './supabase/admin';
import { adjustPoints } from './points';
import { is1x2Hit, isExactScoreHit, isTotalGoalsHit, isBttsHit } from './markets';

export async function settleParlaysForMatch(matchId: string): Promise<{ settledBets: number }> {
  const admin = createAdminClient();
  let settledBets = 0;
  const { data: legs } = await admin.from('bet_legs').select('id, bet_id, selection, result_status, market_id').eq('match_id', matchId).eq('result_status', 'pending');
  if (!legs || legs.length === 0) return { settledBets: 0 };
  const { data: match } = await admin.from('matches').select('ft_home_goals, ft_away_goals, status').eq('id', matchId).single();
  if (!match || match.status !== 'settled' || match.ft_home_goals == null || match.ft_away_goals == null) return { settledBets: 0 };

  for (const leg of legs) {
    const { data: market } = await admin.from('markets').select('market_type').eq('id', leg.market_id).single();
    if (!market) continue;
    const hit = isLegHit(market.market_type, match.ft_home_goals, match.ft_away_goals, leg.selection);
    await admin.from('bet_legs').update({ result_status: hit ? 'won' : 'lost' }).eq('id', leg.id);
  }
  const betIds = Array.from(new Set(legs.map(l => l.bet_id)));
  for (const betId of betIds) { await settleSingleBet(betId); settledBets++; }
  return { settledBets };
}

function isLegHit(marketType: string, ftH: number, ftA: number, selection: string): boolean {
  switch (marketType) {
    case '1x2': return is1x2Hit(ftH, ftA, selection);
    case 'exact_score': return isExactScoreHit(ftH, ftA, selection);
    case 'total_goals': return isTotalGoalsHit(ftH, ftA, selection);
    case 'btts': return isBttsHit(ftH, ftA, selection);
    default: return false;
  }
}

async function settleSingleBet(betId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: bet } = await admin.from('bets').select('*').eq('id', betId).single();
  if (!bet || bet.status !== 'pending') return;
  const { data: legs } = await admin.from('bet_legs').select('id, result_status').eq('bet_id', betId);
  if (!legs || !legs.every(l => l.result_status !== 'pending')) return;
  const { data: lines } = await admin.from('bet_lines').select('*').eq('bet_id', betId);
  if (!lines) return;
  const legMap = new Map(legs.map(l => [l.id, l.result_status]));
  let totalReturn = 0; let anyWon = false;
  for (const line of lines) {
    const legIds = line.leg_ids as string[]; let won = true; let hasVoid = false;
    for (const lid of legIds) { const r = legMap.get(lid); if (r === 'lost') { won = false; break; } if (r === 'void') hasVoid = true; }
    let s: 'won'|'lost'|'void'; let ret = 0;
    if (!won) { s = 'lost'; } else if (hasVoid) { s = 'void'; ret = bet.stake_per_line * bet.multiple; } else { s = 'won'; ret = Math.round(line.line_return); anyWon = true; }
    totalReturn += ret;
    await admin.from('bet_lines').update({ status: s, settled_return: ret }).eq('id', line.id);
  }
  await admin.from('bets').update({ status: anyWon ? 'settled' : 'lost', settled_return: totalReturn }).eq('id', betId);
  if (totalReturn > 0) { const { data: bi } = await admin.from('bets').select('user_id').eq('id', betId).single(); if (bi) await adjustPoints(bi.user_id, totalReturn, 'parlay settle', betId); }
}
`);

console.log('BATCH 1 DONE');
