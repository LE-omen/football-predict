// types/database.ts

export type UserRole = 'user' | 'admin';
export type MatchStatus = 'scheduled' | 'locked' | 'settled' | 'canceled';
export type MarketType = '1x2' | 'exact_score' | 'total_goals' | 'btts' | 'ht_1x2';
export type MarketResultStatus = 'pending' | 'won' | 'lost' | 'void';

export interface UserRow {
  id: string;
  nickname: string;
  password_hash: string;
  role: UserRole;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface InviteCodeRow {
  id: string;
  code: string;
  created_by: string | null;
  is_active: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchRow {
  id: string;
  league: string | null;
  stage: string | null;
  home_team: string;
  away_team: string;
  start_time: string;
  status: MatchStatus;
  ft_home_goals: number | null;
  ft_away_goals: number | null;
  ht_home_goals: number | null;
  ht_away_goals: number | null;

  created_at: string;
  updated_at: string;
  api_football_fixture_id: number | null;
  api_football_league_id: number | null;
  api_football_season: number | null;
  venue: string | null;
  raw_status: string | null;
  last_synced_at: string | null;
  external_provider: string | null;
  external_id: string | null;
  lock_time: string | null;
}

export interface MarketRow {
  id: string;
  match_id: string;
  market_type: MarketType;
  title: string;
  options: string[];
  multiplier: number;
  is_active: boolean;
  market_result: MarketResultStatus;
  created_at: string;
  updated_at: string;
}

export interface PredictionRow {
  id: string;
  user_id: string;
  match_id: string;
  market_id: string;
  selected_option: string;
  stake_points: number;
  status: MarketResultStatus;
  payout_points: number;
  created_at: string;
  updated_at: string;
}

export interface ReliefLogRow {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
  created_date: string;
}

export interface PointTransactionRow {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  ref_id: string | null;
  created_at: string;
}

export interface ApiSyncLogRow {
  id: string;
  sync_type: string;
  status: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}

export interface ExternalOddsRawRow {
  id: string;
  fixture_id: number;
  bookmaker_name: string | null;
  bet_key: string;
  bet_label: string | null;
  values_json: unknown[];
  synced_at: string;
}