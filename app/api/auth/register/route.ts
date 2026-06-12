import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { setSessionCookie } from '../../../../lib/auth';
import { isValidNickname, isValidPassword, isValidInviteCode } from '../../../../lib/validators';
import { POINTS_INITIAL } from '../../../../lib/constants';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nickname = String(body?.nickname ?? '').trim();
    const password = String(body?.password ?? '');
    const inviteCode = String(body?.inviteCode ?? '').trim();
    if (!isValidNickname(nickname)) return NextResponse.json({ error: 'invalid nickname' }, { status: 400 });
    if (!isValidPassword(password)) return NextResponse.json({ error: 'invalid password' }, { status: 400 });
    if (!isValidInviteCode(inviteCode)) return NextResponse.json({ error: 'invalid invite code' }, { status: 400 });

    const admin = createAdminClient();
    const { data: codeRow } = await admin.from('invite_codes').select('*').eq('code', inviteCode).eq('is_active', true).is('used_by', null).single();
    if (!codeRow) return NextResponse.json({ error: 'invite code invalid or used' }, { status: 400 });

    const { data: exists } = await admin.from('users').select('id').eq('nickname', nickname).single();
    if (exists) return NextResponse.json({ error: 'nickname taken' }, { status: 400 });

    const { data: user, error: insertErr } = await admin.from('users').insert({ nickname, password_hash: password, role: 'user', points: POINTS_INITIAL }).select('id, nickname, role, points').single();
    if (insertErr || !user) return NextResponse.json({ error: 'register failed' }, { status: 500 });

    await admin.from('invite_codes').update({ used_by: user.id, used_at: new Date().toISOString(), is_active: false }).eq('id', codeRow.id);
    setSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (e: any) { return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 }); }
}