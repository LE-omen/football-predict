import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? '服务异常' }, { status: 500 });
  }
}
