// lib/auth.ts
import { cookies } from 'next/headers';
import { createAdminClient } from './supabase/admin';

export const SESSION_COOKIE = 'app_session_user_id';

export function setSessionCookie(userId: string) {
  cookies().set(SESSION_COOKIE, userId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}

export async function getCurrentUser() {
  const userId = cookies().get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.from('users').select('id, nickname, role, points').eq('id', userId).single();
  if (error || !data) return null;
  return data;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('unauthorized');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') throw new Error('forbidden');
  return user;
}