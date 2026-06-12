import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const matchId = params.id;
    const admin = createAdminClient();
    const { data: match, error: matchErr } = await admin.from('matches').select('*').eq('id', matchId).single();
    if (matchErr || !match) return NextResponse.json({ error: 'match not found' }, { status: 404 });
    const { data: markets } = await admin.from('markets').select('*').eq('match_id', matchId).eq('is_active', true).order('market_type');
    return NextResponse.json({ match, markets: markets ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'service error' }, { status: 500 });
  }
}