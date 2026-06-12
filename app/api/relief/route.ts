import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { createAdminClient } from '../../../lib/supabase/admin';
import { RELIEF_AMOUNT, RELIEF_MAX_PER_DAY, RELIEF_MIN_POINTS } from '../../../lib/constants';
import { adjustPoints } from '../../../lib/points';

export async function POST() {
  try {
    const user = await requireUser();
    if (user.points >= RELIEF_MIN_POINTS) return NextResponse.json({ error: 'points not low enough' }, { status: 400 });

    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await admin.from('relief_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('created_date', today);
    if ((count ?? 0) >= RELIEF_MAX_PER_DAY) return NextResponse.json({ error: 'daily limit reached' }, { status: 400 });

    const { error: logErr } = await admin.from('relief_logs').insert({ user_id: user.id, amount: RELIEF_AMOUNT, created_date: today });
    if (logErr) return NextResponse.json({ error: 'claim failed' }, { status: 500 });

    const nextPoints = await adjustPoints(user.id, RELIEF_AMOUNT, 'daily relief');
    return NextResponse.json({ ok: true, points: nextPoints });
  } catch (e: any) { const msg = e?.message ?? 'error'; const code = msg === 'unauthorized' ? 401 : 500; return NextResponse.json({ error: msg }, { status: code }); }
}