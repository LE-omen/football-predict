import { NextResponse } from 'next/server';
import { runUpdateMatchesAndSettle } from '../../../../lib/jobs/updateMatchesAndSettle';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.ADMIN_JOB_SECRET;

    if (!secret) {
      return NextResponse.json({ error: 'ADMIN_JOB_SECRET not configured' }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const result = await runUpdateMatchesAndSettle();
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}