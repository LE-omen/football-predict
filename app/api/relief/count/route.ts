import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { createAdminClient } from '../../../../lib/supabase/admin';

export async function GET() {
  try {
    const user = await requireUser();
    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await admin.from('relief_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('created_date', today);
    return NextResponse.json({ count: count ?? 0 });
  } catch (e: any) {
    const msg = e?.message ?? 'error';
    const code = msg === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}

