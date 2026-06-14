import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';
import { WC2026_GROUPS, computeGroupStandings } from '../../../lib/groups';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: matches } = await admin
      .from('matches')
      .select('home_team, away_team, ft_home_goals, ft_away_goals, status')
      .eq('status', 'settled');

    const settledMatches = (matches ?? [])
      .filter((m: any) => m.ft_home_goals != null && m.ft_away_goals != null)
      .map((m: any) => ({
        home_team: m.home_team,
        away_team: m.away_team,
        ft_home_goals: Number(m.ft_home_goals),
        ft_away_goals: Number(m.ft_away_goals),
      }));

    const standingsMap = computeGroupStandings(settledMatches);

    const groups = WC2026_GROUPS.map((g) => ({
      letter: g.letter,
      teams: g.teams.map((t) => t.name),
      standings: standingsMap.get(g.letter) ?? [],
    }));

    return NextResponse.json({ groups });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 });
  }
}
