import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { createAdminClient } from '../../../lib/supabase/admin';
import { isValidNickname } from '../../../lib/validators';

// PATCH: 修改昵称（每人一次机会）
export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const nickname = String(body?.nickname ?? '').trim();

    if (!isValidNickname(nickname)) return NextResponse.json({ error: '昵称 2~24 个字符' }, { status: 400 });

    // 检查是否已修改过
    if (user.nickname_changed) return NextResponse.json({ error: '已使用过修改昵称机会' }, { status: 400 });

    const admin = createAdminClient();
    const { data: exists } = await admin.from('users').select('id').eq('nickname', nickname).neq('id', user.id).single();
    if (exists) return NextResponse.json({ error: '昵称已被占用' }, { status: 400 });

    const { error } = await admin.from('users').update({ nickname, nickname_changed: true }).eq('id', user.id);
    if (error) return NextResponse.json({ error: '修改失败' }, { status: 500 });

    return NextResponse.json({ ok: true, nickname });
  } catch (e: any) {
    const msg = e?.message ?? 'error';
    return NextResponse.json({ error: msg }, { status: msg === 'unauthorized' ? 401 : 500 });
  }
}

// DELETE: 注销账号
export async function DELETE() {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    // 删除关联数据
    await admin.from('predictions').delete().eq('user_id', user.id);
    await admin.from('points_history').delete().eq('user_id', user.id);
    await admin.from('users').delete().eq('id', user.id);

    return new NextResponse(null, {
      status: 302,
      headers: { Location: '/', 'Set-Cookie': 'session=; Path=/; Max-Age=0' },
    });
  } catch (e: any) {
    const msg = e?.message ?? 'error';
    return NextResponse.json({ error: msg }, { status: msg === 'unauthorized' ? 401 : 500 });
  }
}