import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('users')
      .select('id, nickname, points')
      .neq('role', 'admin')
      .order('points', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: '查询失败' }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? '服务异常' }, { status: 500 });
  }
}
