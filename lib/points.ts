// lib/points.ts
import { createAdminClient } from './supabase/admin';

export async function adjustPoints(userId: string, amount: number, reason: string, refId?: string) {
  const admin = createAdminClient();
  const { data: user, error: getUserErr } = await admin.from('users').select('id, points').eq('id', userId).single();
  if (getUserErr || !user) throw new Error('user not found');

  const next = user.points + amount;
  if (next < 0) throw new Error('insufficient points');

  const { error: updErr } = await admin.from('users').update({ points: next }).eq('id', userId);
  if (updErr) throw new Error('update points failed');

  const { error: txErr } = await admin.from('point_transactions').insert({ user_id: userId, amount, reason, ref_id: refId ?? null });
  if (txErr) throw new Error('tx log failed');

  return next;
}