import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { MULTIPLIER_DEFAULT } from '../../../../lib/constants';

export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data: matches } = await admin.from('matches').select('*').order('start_time', { ascending: true });
    return NextResponse.json({ matches: matches ?? [] });
  } catch (e: any) { const msg = e?.message ?? 'error'; const code = msg === 'forbidden' || msg === 'unauthorized' ? 401 : 500; return NextResponse.json({ error: msg }, { status: code }); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const admin = createAdminClient();
    const league = body?.league ?? 'World Cup';
    const stage = String(body?.stage ?? '');
    const homeTeam = String(body?.homeTeam ?? '').trim();
    const awayTeam = String(body?.awayTeam ?? '').trim();
    const startTime = String(body?.startTime ?? '');
    if (!homeTeam || !awayTeam || !startTime) return NextResponse.json({ error: 'missing params' }, { status: 400 });

    const { data: match, error } = await admin.from('matches').insert({ league, stage, home_team: homeTeam, away_team: awayTeam, start_time: startTime, status: 'scheduled' }).select('*').single();
    if (error || !match) return NextResponse.json({ error: 'create match failed' }, { status: 500 });

    const defaults = [
      { market_type: '1x2', title: '1x2', options: ['home', 'draw', 'away'] },
      { market_type: 'exact_score', title: 'Exact Score', options: ['0-0','1-0','0-1','1-1','2-0','0-2','2-1','1-2','2-2','3-0','0-3','3-1','1-3','3-2','2-3','other'] },
      { market_type: 'total_goals', title: 'Total Goals', options: ['over2.5', 'under2.5'] },
      { market_type: 'btts', title: 'BTTS', options: ['yes', 'no'] },
      { market_type: 'ht_1x2', title: 'HT 1x2', options: ['home', 'draw', 'away'] },
    ] as const;
    for (const d of defaults) {
      await admin.from('markets').insert({ match_id: match.id, market_type: d.market_type, title: d.title, options: d.options, multiplier: MULTIPLIER_DEFAULT[d.market_type] ?? 1.80, is_active: true, market_result: 'pending' });
    }
    return NextResponse.json({ match });
  } catch (e: any) { const msg = e?.message ?? 'error'; const code = msg === 'forbidden' || msg === 'unauthorized' ? 401 : 500; return NextResponse.json({ error: msg }, { status: code }); }
}