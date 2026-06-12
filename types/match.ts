// types/match.ts
import type { MatchRow, MatchStatus } from './database';

export type MatchItem = Pick<
  MatchRow,
  | 'id'
  | 'league'
  | 'stage'
  | 'home_team'
  | 'away_team'
  | 'start_time'
  | 'status'
  | 'ft_home_goals'
  | 'ft_away_goals'
  | 'ht_home_goals'
  | 'ht_away_goals'
  | 'venue'
  | 'raw_status'
  | 'api_football_fixture_id'
  | 'last_synced_at'
>;

export type MatchListQuery = {
  status?: MatchStatus;
  limit?: number;
  offset?: number;
};