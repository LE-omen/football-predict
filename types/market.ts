// types/market.ts
import type { MarketRow, MarketType } from './database';

export interface MarketItem {
  id: string;
  match_id: string;
  market_type: MarketType;
  title: string;
  options: string[];
  multiplier: number;
  is_active: boolean;
  market_result: string;
  option_odds?: Record<string, string>;
}

export const marketTypeLabel: Record<MarketType, string> = {
  '1x2': '胜平负',
  exact_score: '准确比分',
  total_goals: '总进球',
  btts: '双方是否进球',
  ht_1x2: '半场胜平负',
};

export const marketOptionLabel: Record<string, string> = {
  home: '主胜',
  draw: '平',
  away: '客胜',
  yes: '是',
  no: '否',
  'over2.5': '大于 2.5',
  'under2.5': '小于 2.5',
  '0': '0球',
  '1': '1球',
  '2': '2球',
  '3': '3球',
  '4': '4球',
  '5': '5球',
  '6': '6球',
  '7+': '7+球',
};

export function getOptionLabel(value: string): string {
  return marketOptionLabel[value] ?? value;
}