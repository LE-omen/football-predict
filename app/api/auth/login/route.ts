import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { setSessionCookie } from '../../../../lib/auth';
import { isValidNickname, isValidPassword } from '../../../../lib/validators';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nickname = String(body?.nickname ?? '').trim();
    const password = String(body?.password ?? '');
    if (!isValidNickname(nickname)) return NextResponse.json({ error: 'invalid nickname' }, { status: 400 });
    if (!isValidPassword(password)) return NextResponse.json({ error: 'invalid password' }, { status: 400 });

    const admin = createAdminClient();
    const { data: user } = await admin.from('users').select('id, nickname, role, points, password_hash').eq('nickname', nickname).single();
    if (!user) return NextResponse.json({ error: 'wrong credentials' }, { status: 400 });
    if (user.password_hash !== password) return NextResponse.json({ error: 'wrong credentials' }, { status: 400 });

    setSessionCookie(user.id);
    return NextResponse.json({ user: { id: user.id, nickname: user.nickname, role: user.role, points: user.points } });
  } catch (e: any) { return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 }); }
}