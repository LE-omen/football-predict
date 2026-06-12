import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { settleMatch } from '../../../../lib/settlement';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const matchId = String(body?.matchId ?? '');
    const ftHome = Number(body?.ftHomeGoals);
    const ftAway = Number(body?.ftAwayGoals);
    const htHome = body?.htHomeGoals != null ? Number(body?.htHomeGoals) : null;
    const htAway = body?.htAwayGoals != null ? Number(body?.htAwayGoals) : null;
    if (!matchId) return NextResponse.json({ error: 'missing match id' }, { status: 400 });
    if (!Number.isFinite(ftHome) || !Number.isFinite(ftAway)) return NextResponse.json({ error: 'set FT score' }, { status: 400 });

    const admin = createAdminClient();
    await admin.from('matches').update({ ft_home_goals: ftHome, ft_away_goals: ftAway, ht_home_goals: htHome, ht_away_goals: htAway }).eq('id', matchId);
    const result = await settleMatch(matchId);
    return NextResponse.json(result);
  } catch (e: any) { const msg = e?.message ?? 'error'; const code = msg === 'forbidden' || msg === 'unauthorized' ? 401 : 500; return NextResponse.json({ error: msg }, { status: code }); }
}