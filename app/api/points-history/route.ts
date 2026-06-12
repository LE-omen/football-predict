import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function GET() {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    const { data: txs } = await admin
      .from('point_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    return NextResponse.json({ transactions: txs ?? [] });
  } catch (e: any) {
    const msg = e?.message ?? 'service error';
    const code = msg === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}