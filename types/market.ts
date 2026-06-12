// types/market.ts
import type { MarketRow, MarketType } from './database';

export type MarketItem = Pick<MarketRow, 'id' | 'match_id' | 'market_type' | 'title' | 'options' | 'multiplier' | 'is_active' | 'market_result'>;

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
};

export function getOptionLabel(value: string): string {
  return marketOptionLabel[value] ?? value;
}