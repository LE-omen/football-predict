// lib/jobs/syncEspnSettle.ts
// 独立的比分拉取和结算流程（从 ESPN 拉取比分，然后结算）
// 只处理比分和结算，不干涉赔率

import { createAdminClient } from '../supabase/admin';
import { settleMatch } from '../settlement';
import { settleParlaysForMatch } from '../parlaySettle';
import { fetchEspnScoreboard } from '../data-providers/espnClient';

export interface SyncEspnResult {
  ok: boolean;
  message: string;
  scoreUpdated: number;
  settled: number;
  totalEspn: number;
  errors: string[];
}

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

export async function runSyncEspnSettle(): Promise<SyncEspnResult> {
  const result: SyncEspnResult = { ok: true, message: '', scoreUpdated: 0, settled: 0, totalEspn: 0, errors: [] };
  
  try {
    const admin = createAdminClient();
    
    // Step 1: Fetch ESPN scoreboard
    const events = await fetchEspnScoreboard('20260611', '20260801');
    result.totalEspn = events.length;
    
    // Step 2: Build score map
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
    
    // Step 3: Get unsettled matches
    const { data: dbMatches } = await admin
      .from('matches')
      .select('id, home_team, away_team, status')
      .neq('status', 'settled');
    
    if (!dbMatches || dbMatches.length === 0) {
      result.message = 'no unsettled matches';
      return result;
    }
    
    // Step 4: Update scores and settle
    for (const match of dbMatches) {
      const key = match.home_team + '|' + match.away_team;
      const score = espnScores.get(key);
      if (!score) continue;
      
      // Update match score
      await admin.from('matches').update({
        ft_home_goals: score.homeScore,
        ft_away_goals: score.awayScore,
        raw_status: 'FT',
      }).eq('id', match.id);
      result.scoreUpdated++;
      
      // Settle if not already settled
      if (match.status !== 'settled') {
        try {
          await settleMatch(match.id);
          await settleParlaysForMatch(match.id);
          result.settled++;
        } catch (e: unknown) {
          result.errors.push(match.home_team + ' vs ' + match.away_team + ': ' + (e instanceof Error ? e.message : 'settle error'));
        }
      }
    }
    
    result.message = `Score updated: ${result.scoreUpdated}, Settled: ${result.settled}, ESPN total: ${result.totalEspn}`;
    
  } catch (e: unknown) {
    result.errors.push(e instanceof Error ? e.message : 'unknown error');
    result.ok = false;
  }
  
  if (result.errors.length > 0) result.ok = false;
  return result;
}
