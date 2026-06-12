import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function GET() {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    const { data: preds } = await admin
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: markets } = await admin.from('markets').select('*');
    const { data: matches } = await admin.from('matches').select('*');

    const marketMap = new Map((markets ?? []).map((m) => [m.id, m]));
    const matchMap = new Map((matches ?? []).map((m) => [m.id, m]));

    const items = (preds ?? []).map((p) => {
      const market = marketMap.get(p.market_id);
      const match = matchMap.get(p.match_id);
      return {
        id: p.id,
        user_id: p.user_id,
        match_id: p.match_id,
        market_id: p.market_id,
        selected_option: p.selected_option,
        stake_points: p.stake_points,
        status: p.status,
        payout_points: p.payout_points,
        created_at: p.created_at,
        match_title: match ? `${match.home_team} vs ${match.away_team}` : p.match_id,
        market_title: market?.title ?? p.market_id,
        selected_option_label: p.selected_option,
        multiplier: market?.multiplier ?? 1,
      };
    });

    return NextResponse.json({ predictions: items });
  } catch (e: any) {
    const msg = e?.message ?? 'service error';
    const code = msg === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}