import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
import { createAdminClient } from '../../../../lib/supabase/admin';

export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data } = await admin.from('invite_codes').select('*').order('created_at', { ascending: false });
    return NextResponse.json({ codes: data ?? [] });
  } catch (e: any) { const msg = e?.message ?? 'error'; const code = msg === 'forbidden' || msg === 'unauthorized' ? 401 : 500; return NextResponse.json({ error: msg }, { status: code }); }
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();
    const code = String(body?.code ?? '').trim();
    if (!code || code.length < 1) return NextResponse.json({ error: 'code required' }, { status: 400 });

    const admin = createAdminClient();
    const { data: exists } = await admin.from('invite_codes').select('id').eq('code', code).single();
    if (exists) return NextResponse.json({ error: 'code exists' }, { status: 400 });

    const { data: row, error } = await admin.from('invite_codes').insert({ code, created_by: adminUser.id, is_active: true }).select('*').single();
    if (error || !row) return NextResponse.json({ error: 'create failed' }, { status: 500 });
    return NextResponse.json({ code: row });
  } catch (e: any) { const msg = e?.message ?? 'error'; const code = msg === 'forbidden' || msg === 'unauthorized' ? 401 : 500; return NextResponse.json({ error: msg }, { status: code }); }
}