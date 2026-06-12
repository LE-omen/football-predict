// lib/constants.ts
export const APP_NAME = '足球积分预测';

export const POINTS_INITIAL = 10000;

export const STAKE_MIN = 100;
export const STAKE_MAX = 5000;
export const STAKE_STEP = 100;

export const MATCH_USER_STAKE_LIMIT = 5000;

export const LOCK_MINUTES_BEFORE_KICKOFF = 30;

export const RELIEF_AMOUNT = 1000;
export const RELIEF_MAX_PER_DAY = 3;
export const RELIEF_MIN_POINTS = 100;

export const MULTIPLIER_DEFAULT: Record<string, number> = {
  '1x2': 1.80,
  exact_score: 7.00,
  total_goals: 1.90,
  btts: 1.85,
  ht_1x2: 2.20,
};
