// types/bet.ts
// 串关系统类型定义

import type { MarketResultStatus } from './database';

export type BetType = 'single' | 'parlay';

export interface BetRow {
  id: string;
  user_id: string;
  bet_type: BetType;
  pass_type: string | null;
  legs_count: number;
  stake_per_line: number;
  multiple: number;
  total_stake: number;
  max_potential_return: number;
  settled_return: number;
  status: MarketResultStatus;
  created_at: string;
  updated_at: string;
}

export interface BetLegRow {
  id: string;
  bet_id: string;
  match_id: string;
  market_id: string;
  market_type: string;
  selection: string;
  odds_snapshot: number;
  result_status: MarketResultStatus;
  created_at: string;
}

export interface BetLineRow {
  id: string;
  bet_id: string;
  pass_type: string;
  leg_ids: string[];
  leg_match_ids: string[];
  line_odds: number;
  line_return: number;
  settled_return: number;
  status: MarketResultStatus;
  created_at: string;
}

/** 投注单项目（前端展示用） */
export interface BetSlipItem {
  betId: string;
  betType: BetType;
  passType: string | null;
  legsCount: number;
  stakePerLine: number;
  multiple: number;
  totalStake: number;
  maxPotentialReturn: number;
  settledReturn: number;
  status: MarketResultStatus;
  legs: (BetLegRow & { match_title: string; market_title: string })[];
  lines: BetLineRow[];
  createdAt: string;
}
