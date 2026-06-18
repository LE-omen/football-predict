import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { fetchEspnScoreboard } from '../../../../lib/data-providers/espnClient';
import { settleMatch } from '../../../../lib/settlement';
import { settleParlaysForMatch } from '../../../../lib/parlaySettle';

const ESPN_TO_CN: Record<string, string> = {
  'Czechia': '捷克', 'Turkey': '土耳其',
  'Bosnia-Herzegovina': '波黑', 'Bosnia and Herzegovina': '波黑',
  'Democratic Republic Congo': '刚果民主共和国',
  'Cape Verde Islands': '佛得角', 'Cape Verde': '佛得角',
  'United States': '美国', 'USA': '美国',
  'Curacao': '库拉索', 'South Korea': '韩国',
  'Korea Republic': '韩国', 'Czech Republic': '捷克',
  'Ivory Coast': '科特迪瓦', 'DR Congo': '刚果民主共和国',
  'Saudi Arabia': '沙特阿拉伯', 'New Zealand': '新西兰',
  'Bosnia': '波黑',
};

export async function POST() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const events = await fetchEspnScoreboard('20260611', '20260801');

    const { data: dbMatches } = await admin
      .from('matches')
      .select('id, home_team, away_team, status')
      .neq('status', 'settled');

    if (!dbMatches || dbMatches.length === 0) {
      return NextResponse.json({ ok: true, message: 'no unsettled matches', scoreUpdated: 0, settled: 0 });
    }

    const espnScores = new Map<string, { homeScore: number; awayScore: number }>();
    for (const ev of events) {
      const comp = ev.competitions[0];
      if (!comp || comp.status.type.state !== 'post') continue;
      const homeComp = comp.competitors.find((c: any) => c.homeAway === 'home');
      const awayComp = comp.competitors.find((c: any) => c.homeAway === 'away');
      if (!homeComp || !awayComp) continue;
      const hs = parseInt(homeComp.score ?? '', 10);
      const as = parseInt(awayComp.score ?? '', 10);
      if (isNaN(hs) || isNaN(as)) continue;
      const homeCn = ESPN_TO_CN[homeComp.team.displayName] ?? homeComp.team.displayName;
      const awayCn = ESPN_TO_CN[awayComp.team.displayName] ?? awayComp.team.displayName;
      espnScores.set(homeCn + '|' + awayCn, { homeScore: hs, awayScore: as });
    }

    let scoreUpdated = 0;
    let settled = 0;
    const errors: string[] = [];

    for (const match of dbMatches) {
      const key = match.home_team + '|' + match.away_team;
      const score = espnScores.get(key);
      if (!score) continue;

      await admin.from('matches').update({
        ft_home_goals: score.homeScore,
        ft_away_goals: score.awayScore,
        raw_status: 'FT',
      }).eq('id', match.id);
      scoreUpdated++;

      if (match.status !== 'settled') {
        try {
          await settleMatch(match.id);
          await settleParlaysForMatch(match.id);
          settled++;
        } catch (e: unknown) {
          errors.push(match.home_team + ' vs ' + match.away_team + ': ' + (e instanceof Error ? e.message : 'settle error'));
        }
      }
    }

    await admin.from('api_sync_logs').insert({
      sync_type: 'espn_scores_settle', status: 'ok',
      detail: { scoreUpdated, settled, totalEspn: espnScores.size, errors: errors.length },
    });

    return NextResponse.json({ ok: true, scoreUpdated, settled, totalEspn: espnScores.size, errors });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'error';
    const code = msg === 'forbidden' || msg === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
