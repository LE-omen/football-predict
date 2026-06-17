// app/api/mybets/route.ts
import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function GET() {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    // Fetch bets with legs and lines
    const { data: bets } = await admin
      .from('bets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!bets || bets.length === 0) return NextResponse.json({ bets: [] });

    const betIds = bets.map(b => b.id);

    const { data: legs } = await admin
      .from('bet_legs')
      .select('*')
      .in('bet_id', betIds);

    const { data: lines } = await admin
      .from('bet_lines')
      .select('*')
      .in('bet_id', betIds);

    // Enrich legs with match info
    const matchIds = Array.from(new Set((legs ?? []).map(l => l.match_id)));
    const { data: matches } = await admin
      .from('matches')
      .select('id, home_team, away_team, status, ft_home_goals, ft_away_goals')
      .in('id', matchIds);

    const matchMap = new Map((matches ?? []).map(m => [m.id, m]));

    const enrichedBets = bets.map(bet => ({
      ...bet,
      legs: (legs ?? []).filter(l => l.bet_id === bet.id).map(l => ({
        ...l,
        match: matchMap.get(l.match_id) ?? null,
      })),
      lines: (lines ?? []).filter(l => l.bet_id === bet.id),
    }));

    return NextResponse.json({ bets: enrichedBets });
  } catch (e: any) {
    const msg = e?.message ?? 'service error';
    const code = msg === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}


