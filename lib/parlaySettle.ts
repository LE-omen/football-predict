// lib/parlaySettle.ts
// ���ؽ��㣺��һ�����������󣬸������ bet_legs ״̬������ bet_lines

import { createAdminClient } from './supabase/admin';
import { adjustPoints } from './points';

/**
 * һ�������������ô˺���
 * 1. �ҵ����й����ñ����� bet_legs
 * 2. ���� leg �� result_status
 * 3. ���ÿ�� bet ������ lines��������ɵ� bet
 */
export async function settleParlaysForMatch(matchId: string): Promise<{ settledBets: number }> {
  const admin = createAdminClient();
  let settledBets = 0;

  // 1. �ҵ��ñ������������� bet_legs
  const { data: legs } = await admin
    .from('bet_legs')
    .select('id, bet_id, selection, result_status')
    .eq('match_id', matchId)
    .eq('result_status', 'pending');

  if (!legs || legs.length === 0) return { settledBets: 0 };

  // ��ȡ�ñ����ıȷֺͽ��
  const { data: match } = await admin
    .from('matches')
    .select('ft_home_goals, ft_away_goals, ht_home_goals, ht_away_goals, status')
    .eq('id', matchId)
    .single();

  if (!match || match.status !== 'settled' || match.ft_home_goals == null || match.ft_away_goals == null) {
    return { settledBets: 0 };
  }

  // 2. ��ÿ�� leg�������г������ж���Ӯ
  for (const leg of legs) {
    const { data: market } = await admin
      .from('markets')
      .select('market_type')
      .eq('id', (await admin.from('bet_legs').select('market_id').eq('id', leg.id).single()).data?.market_id ?? '')
      .single();

    if (!market) continue;

    const hit = isLegHit(
      market.market_type,
      match.ft_home_goals,
      match.ft_away_goals,
      match.ht_home_goals ?? 0,
      match.ht_away_goals ?? 0,
      leg.selection,
    );

    await admin
      .from('bet_legs')
      .update({ result_status: hit ? 'won' : 'lost' })
      .eq('id', leg.id);
  }

  // 3. ���ÿ����ص� bet
  const betIds = Array.from(new Set(legs.map(l => l.bet_id)));
  for (const betId of betIds) {
    await settleSingleBet(betId);
    settledBets++;
  }

  return { settledBets };
}

function isLegHit(marketType: string, ftH: number, ftA: number, htH: number, htA: number, selection: string): boolean {
  switch (marketType) {
    case '1x2':
      if (ftH === ftA) return selection === 'draw';
      if (ftH > ftA) return selection === 'home';
      return selection === 'away';
    case 'exact_score': {
      const expected = `${ftH}-${ftA}`;
      return selection === expected;
    }
    case 'total_goals': {
      const total = ftH + ftA;
      if (selection === '7+') return total >= 7;
      return total === parseInt(selection);
    }
    case 'btts':
      return selection === (ftH > 0 && ftA > 0 ? 'yes' : 'no');
    case 'ht_1x2':
      if (htH === htA) return selection === 'draw';
      if (htH > htA) return selection === 'home';
      return selection === 'away';
    default:
      return false;
  }
}

async function settleSingleBet(betId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: bet } = await admin.from('bets').select('*').eq('id', betId).single();
  if (!bet || bet.status !== 'pending') return;

  // ��ȡ���� legs
  const { data: legs } = await admin.from('bet_legs').select('id, result_status').eq('bet_id', betId);
  if (!legs) return;

  // ����Ƿ����� legs ���ѽ���
  const allSettled = legs.every(l => l.result_status !== 'pending');
  if (!allSettled) return;

  // ��ȡ���� lines
  const { data: lines } = await admin.from('bet_lines').select('*').eq('bet_id', betId);
  if (!lines) return;

  // ���� leg ��� map
  const legResultMap = new Map<string, 'won' | 'lost' | 'void'>();
  for (const leg of legs) {
    legResultMap.set(leg.id, leg.result_status as 'won' | 'lost' | 'void');
  }

  // ����ÿ�� line
  let totalSettledReturn = 0;
  let anyWon = false;

  for (const line of lines) {
    const legIds = line.leg_ids as string[];
    let lineWon = true;
    let hasVoid = false;

    for (const legId of legIds) {
      const result = legResultMap.get(legId);
      if (result === 'lost') { lineWon = false; break; }
      if (result === 'void') hasVoid = true;
    }

    let lineStatus: 'won' | 'lost' | 'void';
    let lineReturn = 0;

    if (!lineWon) {
      lineStatus = 'lost';
    } else if (hasVoid) {
      // void ��ע���˻���ע����
      lineStatus = 'void';
      lineReturn = bet.stake_per_line * bet.multiple;
    } else {
      lineStatus = 'won';
      lineReturn = Math.round(line.line_return);
      anyWon = true;
    }

    totalSettledReturn += lineReturn;

    await admin
      .from('bet_lines')
      .update({ status: lineStatus, settled_return: lineReturn })
      .eq('id', line.id);
  }

  // ���� bet ״̬
  const betStatus = anyWon ? 'settled' : 'lost';
  await admin
    .from('bets')
    .update({ status: betStatus, settled_return: totalSettledReturn })
    .eq('id', betId);

  // �������
  if (totalSettledReturn > 0) {
    const { data: betInfo } = await admin.from('bets').select('user_id').eq('id', betId).single();
    if (betInfo) {
      await adjustPoints(betInfo.user_id, totalSettledReturn, 'parlay settle', betId);
    }
  }
}

