import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { createAdminClient } from '../../../lib/supabase/admin';
import { isValidStake } from '../../../lib/validators';
import { LOCK_MINUTES_BEFORE_KICKOFF, MATCH_USER_STAKE_LIMIT } from '../../../lib/constants';
import { isOptionValidForMarket } from '../../../lib/markets';
import { adjustPoints } from '../../../lib/points';
import { minutesBetween } from '../../../lib/utils';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const matchId = String(body?.matchId ?? body?.match_id ?? '');
    const marketId = String(body?.marketId ?? body?.market_id ?? '');
    const selectedOption = String(body?.selectedOption ?? body?.selected_option ?? '');
    const stake = Number(body?.stakePoints ?? body?.stake_points ?? 0);

    if (!marketId || !selectedOption) {
      return NextResponse.json({ error: 'missing params' }, { status: 400 });
    }
    // Auto-derive matchId from market if not provided
    let resolvedMatchId = matchId;
    if (!resolvedMatchId && marketId) {
      const adminPre = createAdminClient();
      const { data: mktRow } = await adminPre.from('markets').select('match_id').eq('id', marketId).single();
      if (mktRow) resolvedMatchId = mktRow.match_id;
    }
    if (!resolvedMatchId) {
      return NextResponse.json({ error: 'missing params' }, { status: 400 });
    }
    if (!isValidStake(stake)) {
      return NextResponse.json({ error: 'stake must be 100~5000, multiple of 100' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: match } = await admin.from('matches').select('*').eq('id', resolvedMatchId).single();
    if (!match) return NextResponse.json({ error: 'match not found' }, { status: 404 });
    if (match.status !== 'scheduled') return NextResponse.json({ error: 'match not open' }, { status: 400 });

    const mins = minutesBetween(new Date(), new Date(match.start_time));
    if (mins <= LOCK_MINUTES_BEFORE_KICKOFF) {
      return NextResponse.json({ error: 'locked 30min before kickoff' }, { status: 400 });
    }

    const { data: market } = await admin.from('markets').select('*').eq('id', marketId).eq('match_id', resolvedMatchId).eq('is_active', true).single();
    if (!market) return NextResponse.json({ error: 'market not found' }, { status: 404 });
    if (!isOptionValidForMarket(market, selectedOption)) {
      return NextResponse.json({ error: 'invalid option' }, { status: 400 });
    }

    const { data: existingPreds } = await admin.from('predictions').select('stake_points').eq('user_id', user.id).eq('match_id', resolvedMatchId);
    const used = (existingPreds ?? []).reduce((s, p) => s + p.stake_points, 0);
    if (used + stake > MATCH_USER_STAKE_LIMIT) {
      return NextResponse.json({ error: 'match stake limit 5000' }, { status: 400 });
    }

    if (user.points < stake) {
      return NextResponse.json({ error: 'insufficient points' }, { status: 400 });
    }

    const { data: pred, error: predErr } = await admin.from('predictions').insert({
      user_id: user.id, match_id: resolvedMatchId, market_id: marketId, selected_option: selectedOption, stake_points: stake, status: 'pending', payout_points: 0,
    }).select('*').single();

    if (predErr || !pred) return NextResponse.json({ error: 'submit failed' }, { status: 500 });

    await adjustPoints(user.id, -stake, 'prediction stake', pred.id);

    return NextResponse.json({ prediction: pred });
  } catch (e: any) {
    const msg = e?.message ?? 'service error';
    const code = msg === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}