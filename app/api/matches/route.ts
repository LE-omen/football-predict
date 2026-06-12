import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const limit = Number(searchParams.get('limit') ?? 50);
    const offset = Number(searchParams.get('offset') ?? 0);

    const admin = createAdminClient();
    let query = admin
      .from('matches')
      .select('*')
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'query failed' }, { status: 500 });
    }

    return NextResponse.json({ matches: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'service error' }, { status: 500 });
  }
}