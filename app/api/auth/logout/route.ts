import { NextResponse } from 'next/server';
import { clearSessionCookie } from '../../../../lib/auth';

export async function POST() {
  try {
    clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? '服务异常' }, { status: 500 });
  }
}
