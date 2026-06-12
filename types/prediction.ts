// types/prediction.ts
import type { PredictionRow, MarketResultStatus } from './database';

export type PredictionItem = Pick<PredictionRow, 'id' | 'user_id' | 'match_id' | 'market_id' | 'selected_option' | 'stake_points' | 'status' | 'payout_points' | 'created_at'>;

export type PredictionHistoryItem = PredictionItem & {
  match_title: string;
  market_title: string;
  selected_option_label: string;
  multiplier: number;
};

export type PredictionStatus = MarketResultStatus;

export const predictionStatusLabel: Record<PredictionStatus, string> = {
  pending: '待结算',
  won: '命中',
  lost: '未命中',
  void: '作废',
};