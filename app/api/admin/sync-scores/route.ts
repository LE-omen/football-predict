import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { fetchWorldCupFixtures } from '../../../../lib/lazq';

export async function POST() {
  await requireAdmin();
  const admin = createAdminClient();
  const started = new Date().toISOString();

  try {
    const resp = await fetchWorldCupFixtures(2026);
    const { matches } = resp.data;

    const { data: localMatches } = await admin
      .from('matches')
      .select('id, api_football_fixture_id, status')
      .not('api_football_fixture_id', 'is', null)
      .neq('status', 'settled');

    if (!localMatches || localMatches.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, message: 'no matches to sync' });
    }

    // Build lazq lookup by match id
    const lazqMap = new Map<string, { s: number; sc: string[] }>();
    for (const roundMatches of Object.values(matches)) {
      for (const m of roundMatches) {
        lazqMap.set(String(m.id), { s: m.s, sc: m.sc });
      }
    }

    let updated = 0;

    for (const local of localMatches) {
      const lazqId = String(local.api_football_fixture_id);
      const lazqData = lazqMap.get(lazqId);
      if (!lazqData) continue;

      const state = lazqData.s;
      const ftHome = lazqData.sc[0] !== '' && lazqData.sc[0] != null ? Number(lazqData.sc[0]) : null;
      const ftAway = lazqData.sc[1] !== '' && lazqData.sc[1] != null ? Number(lazqData.sc[1]) : null;
      const htHome = lazqData.sc[2] !== '' && lazqData.sc[2] != null ? Number(lazqData.sc[2]) : null;
      const htAway = lazqData.sc[3] !== '' && lazqData.sc[3] != null ? Number(lazqData.sc[3]) : null;

      const updateData: Record<string, unknown> = {
        raw_status: state === -1 ? 'FT' : state === 1 ? 'LIVE' : 'NS',
        last_synced_at: started,
      };

      if (state === -1 && local.status !== 'settled' && ftHome != null) {
        updateData.ft_home_goals = ftHome;
        updateData.ft_away_goals = ftAway;
        updateData.ht_home_goals = htHome;
        updateData.ht_away_goals = htAway;
      }

      if (state === 1) {
        updateData.status = 'locked';
      }

      await admin.from('matches').update(updateData).eq('id', local.id);
      updated++;
    }

    await admin.from('api_sync_logs').insert({
      sync_type: 'scores_lazq', status: 'ok',
      detail: { updated, total: localMatches.length },
    });

    return NextResponse.json({ ok: true, updated, total: localMatches.length });
  } catch (e: any) {
    await admin.from('api_sync_logs').insert({ sync_type: 'scores_lazq', status: 'error', detail: { error: e?.message } });
    return NextResponse.json({ error: e?.message ?? 'sync failed' }, { status: 500 });
  }
}