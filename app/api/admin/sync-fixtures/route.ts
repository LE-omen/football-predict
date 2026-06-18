import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { fetchWorldCupFixtures } from '../../../../lib/lazq';
import { MULTIPLIER_DEFAULT } from '../../../../lib/constants';
import type { MarketType } from '../../../../types/database';

const MARKET_DEFAULTS: { t: MarketType; title: string; opts: string[] }[] = [
  { t: '1x2', title: '胜平负', opts: ['home', 'draw', 'away'] },
  { t: 'exact_score', title: '准确比分', opts: ['0-0','1-0','0-1','1-1','2-0','0-2','2-1','1-2','2-2','3-0','0-3','3-1','1-3','3-2','2-3','other'] },
  { t: 'total_goals', title: '总进球', opts: ['over2.5', 'under2.5'] },
  { t: 'btts', title: '双方是否进球', opts: ['yes', 'no'] },
  { t: 'ht_1x2', title: '半场胜平负', opts: ['home', 'draw', 'away'] },
];

type TeamEntry = [number, string, string];

function parseScore(val: string | null | undefined): number | null {
  if (val === '' || val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function rawStatus(state: number): string {
  if (state === -1) return 'FT';
  if (state === 1) return 'LIVE';
  return 'NS';
}

export async function POST() {
  await requireAdmin();
  const admin = createAdminClient();
  const started = new Date().toISOString();

  try {
    const resp = await fetchWorldCupFixtures(2026);
    const { teams, matches, kinds } = resp.data;
    const roundMap = new Map(kinds.map(k => [k[0], k[1]]));
    const teamMap: Map<string, string> = new Map();
    for (const entry of Object.values(teams) as TeamEntry[]) {
      teamMap.set(String(entry[0]), entry[1]);
    }

    let created = 0, updated = 0, skipped = 0;
    const seen = new Set<string>();

    for (const [roundKey, roundMatches] of Object.entries(matches)) {
      const roundIdMatch = roundKey.match(/G(\d+)/);
      const roundId = roundIdMatch ? Number(roundIdMatch[1]) : 0;
      const roundName = roundMap.get(roundId) ?? '小组赛';

      for (const m of roundMatches) {
        const lazqMatchId = String(m.id);
        // Deduplicate: same match can appear in multiple rounds
        if (seen.has(lazqMatchId)) continue;
        seen.add(lazqMatchId);

        try {
          const homeName = teamMap.get(String(m.h)) ?? `Team#${m.h}`;
          const awayName = teamMap.get(String(m.a)) ?? `Team#${m.a}`;
          const startTime = new Date(m.t * 1000).toISOString();
          const ftHome = parseScore(m.sc[0]);
          const ftAway = parseScore(m.sc[1]);
          const htHome = parseScore(m.sc[2]);
          const htAway = parseScore(m.sc[3]);

          // Try external_provider+external_id first, fallback to api_football_fixture_id
          const { data: existing } = await admin
            .from('matches')
            .select('id, status')
            .or(`external_id.eq.${lazqMatchId},api_football_fixture_id.eq.${lazqMatchId}`)
            .maybeSingle();

          if (existing) {
            const updateData: Record<string, unknown> = {
              home_team: homeName, away_team: awayName, start_time: startTime,
              league: '世界杯', stage: roundName,
              raw_status: rawStatus(m.s), last_synced_at: started,
            };
            if (m.s === -1 && existing.status !== 'settled' && ftHome != null) {
              updateData.ft_home_goals = ftHome;
              updateData.ft_away_goals = ftAway;
              updateData.ht_home_goals = htHome;
              updateData.ht_away_goals = htAway;
            }
            await admin.from('matches').update(updateData).eq('id', existing.id);
            updated++;
          } else {
            const { data: newMatch, error: insertErr } = await admin
              .from('matches')
              .insert({
                home_team: homeName, away_team: awayName, start_time: startTime,
                status: 'scheduled', league: '世界杯', stage: roundName,
                raw_status: rawStatus(m.s),
                external_provider: 'lazq', external_id: lazqMatchId,
                ft_home_goals: m.s === -1 ? ftHome : null,
                ft_away_goals: m.s === -1 ? ftAway : null,
                ht_home_goals: m.s === -1 ? htHome : null,
                ht_away_goals: m.s === -1 ? htAway : null,
                last_synced_at: started,
              })
              .select('id')
              .single();

            if (insertErr || !newMatch) { skipped++; continue; }

            for (const mk of MARKET_DEFAULTS) {
              await admin.from('markets').insert({
                match_id: newMatch.id, market_type: mk.t, title: mk.title, options: mk.opts,
                multiplier: MULTIPLIER_DEFAULT[mk.t] ?? 1.80, is_active: true, market_result: 'pending',
              });
            }
            created++;
          }
        } catch { skipped++; }
      }
    }

    await admin.from('api_sync_logs').insert({
      sync_type: 'fixtures_lazq', status: 'ok',
      detail: { created, updated, skipped },
    });

    return NextResponse.json({ ok: true, created, updated, skipped });
  } catch (e: any) {
    await admin.from('api_sync_logs').insert({ sync_type: 'fixtures_lazq', status: 'error', detail: { error: e?.message } });
    return NextResponse.json({ error: e?.message ?? 'sync failed' }, { status: 500 });
  }
}