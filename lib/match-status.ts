// lib/match-status.ts
// Match status helpers for lazq state mapping and auto-lock logic.

export type MatchStatus = 'upcoming' | 'locked' | 'live' | 'finished' | 'settled' | 'cancelled';

/**
 * Map a raw lazq state number + start time to our canonical MatchStatus.
 *   -1 = finished
 *    0 = not started  (→ 'locked' if within 30 min of kickoff, else 'upcoming')
 *    1 = live
 */
export function lazqStateToStatus(state: number, startTime: string): MatchStatus {
  if (state === -1) return 'finished';
  if (state === 1) return 'live';
  // state === 0: not started
  if (shouldAutoLock(startTime)) return 'locked';
  return 'upcoming';
}

/** True when the match is within 30 minutes of kickoff. */
export function shouldAutoLock(startTime: string): boolean {
  const kick = new Date(startTime).getTime();
  if (Number.isNaN(kick)) return false;
  const diffMs = kick - Date.now();
  return diffMs > 0 && diffMs <= 30 * 60 * 1000;
}

export function isFinished(status: MatchStatus): boolean {
  return status === 'finished' || status === 'settled';
}

export function isSettled(status: MatchStatus): boolean {
  return status === 'settled';
}