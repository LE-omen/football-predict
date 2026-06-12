// lib/jobs/lock.ts
// Auto-lock markets and matches whose start_time is within 30 minutes.

import { createAdminClient } from '../supabase/admin';
import { LOCK_MINUTES_BEFORE_KICKOFF } from '../constants';

export async function autoLockMarkets(): Promise<{ lockedCount: number }> {
  const admin = createAdminClient();
  const now = new Date();
  const lockThreshold = new Date(now.getTime() + LOCK_MINUTES_BEFORE_KICKOFF * 60 * 1000).toISOString();

  // Find matches that should be locked: start_time <= now + 30min and status is still 'scheduled'
  const { data: matches, error: matchErr } = await admin
    .from('matches')
    .select('id, start_time, status')
    .lte('start_time', lockThreshold)
    .eq('status', 'scheduled');

  if (matchErr) throw new Error(`fetch matches for lock failed: ${matchErr.message}`);
  if (!matches || matches.length === 0) return { lockedCount: 0 };

  let lockedCount = 0;

  for (const match of matches) {
    // Lock all active markets for this match
    const { data: markets, error: mktErr } = await admin
      .from('markets')
      .select('id, is_active, market_result')
      .eq('match_id', match.id);

    if (mktErr || !markets || markets.length === 0) continue;

    const activeMarkets = markets.filter((m) => m.is_active && m.market_result === 'pending');
    if (activeMarkets.length > 0) {
      const { error: lockErr } = await admin
        .from('markets')
        .update({ is_active: false })
        .in('id', activeMarkets.map((m) => m.id));

      if (!lockErr) lockedCount += activeMarkets.length;
    }

    // Lock the match itself
    await admin
      .from('matches')
      .update({ status: 'locked', locked_at: now.toISOString() })
      .eq('id', match.id)
      .eq('status', 'scheduled');
  }

  return { lockedCount };
}