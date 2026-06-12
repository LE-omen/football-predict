import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/auth';
import { runUpdateMatchesAndSettle } from '../../../../../lib/jobs/updateMatchesAndSettle';

export async function POST() {
  try {
    await requireAdmin();
    const result = await runUpdateMatchesAndSettle();
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'error';
    const code = msg === 'forbidden' || msg === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}