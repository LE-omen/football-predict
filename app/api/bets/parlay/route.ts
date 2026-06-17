// app/api/bets/parlay/route.ts
// POST /api/bets/parlay - 提交串关投注（v2：支持复式+M串N）
import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { adjustPoints } from '../../../../lib/points';
import { calculateFullParlay, PASS_TYPE_MAP } from '../../../../lib/parlay';
import { LOCK_MINUTES_BEFORE_KICKOFF, STAKE_MIN } from '../../../../lib/constants';
import { minutesBetween } from '../../../../lib/utils';
import type { MarketType } from '../../../../types/database';
import type { SelectedMatch } from '../../../../lib/parlay';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    // 支持新格式（selectedMatches）和旧格式（legs）
    let selectedMatches: SelectedMatch[] = body?.selectedMatches;
    const passTypes: string[] = body?.passTypes ?? [];
    const stakePerLine = Number(body?.stakePerLine ?? 0);
    const multiple = Number(body?.multiple ?? 1);

    // 兼容旧格式
    if (!selectedMatches && body?.legs) {
      selectedMatches = body.legs.map((l: { matchId: string; marketId: string; marketType: string; selection: string; odds: number }) => ({
        matchId: l.matchId,
        marketId: l.marketId,
        marketType: l.marketType,
        selections: [{ selection: l.selection, odds: l.odds }],
      }));
    }

    if (!selectedMatches || selectedMatches.length < 2) {
      return NextResponse.json({ error: '至少选择 2 场比赛' }, { status: 400 });
    }
    if (passTypes.length === 0) return NextResponse.json({ error: '请选择过关方式' }, { status: 400 });
    if (!Number.isFinite(stakePerLine) || stakePerLine < STAKE_MIN) {
      return NextResponse.json({ error: `每注金币不能低于 ${STAKE_MIN}` }, { status: 400 });
    }
    if (!Number.isInteger(multiple) || multiple <= 0) {
      return NextResponse.json({ error: '倍数必须为正整数' }, { status: 400 });
    }

    // 校验过关方式
    for (const pt of passTypes) {
      if (!PASS_TYPE_MAP[pt]) return NextResponse.json({ error: `无效的过关方式: ${pt}` }, { status: 400 });
    }

    const admin = createAdminClient();

    // 验证所有比赛和市场，重新读取赔率
    const verifiedMatches: SelectedMatch[] = [];
    for (const sm of selectedMatches) {
      const { data: match } = await admin.from('matches').select('id, status, start_time').eq('id', sm.matchId).single();
      if (!match) return NextResponse.json({ error: `比赛 ${sm.matchId} 不存在` }, { status: 400 });
      if (match.status !== 'scheduled') return NextResponse.json({ error: '比赛已锁定或已结束' }, { status: 400 });
      const mins = minutesBetween(new Date(), new Date(match.start_time));
      if (mins <= LOCK_MINUTES_BEFORE_KICKOFF) return NextResponse.json({ error: '比赛已锁定(开赛前30分钟)' }, { status: 400 });

      const { data: market } = await admin.from('markets').select('id, multiplier, option_odds, is_active').eq('id', sm.marketId).eq('match_id', sm.matchId).single();
      if (!market || !market.is_active) return NextResponse.json({ error: '市场不存在或已关闭' }, { status: 400 });

      const optionOdds = (market.option_odds ?? {}) as Record<string, string>;
      const verifiedSelections: { selection: string; odds: number }[] = [];

      for (const sel of sm.selections) {
        let realOdds: number;
        if (optionOdds[sel.selection]) {
          realOdds = parseFloat(optionOdds[sel.selection]);
          if (isNaN(realOdds) || realOdds <= 0) realOdds = market.multiplier;
        } else {
          realOdds = market.multiplier;
        }
        verifiedSelections.push({ selection: sel.selection, odds: realOdds });
      }

      verifiedMatches.push({
        matchId: sm.matchId,
        marketId: sm.marketId,
        marketType: sm.marketType,
        selections: verifiedSelections,
      });
    }

    // 计算串关
    const preview = calculateFullParlay({ selectedMatches: verifiedMatches, passTypes, stakePerLine, multiple });
    if (preview.totalStake <= 0) return NextResponse.json({ error: '计算错误' }, { status: 400 });
    if (user.points < preview.totalStake) {
      return NextResponse.json({ error: `金币不足，需要 ${preview.totalStake}，当前 ${user.points}` }, { status: 400 });
    }

    // 创建 bet
    const { data: bet, error: betErr } = await admin.from('bets').insert({
      user_id: user.id,
      bet_type: 'parlay',
      pass_type: passTypes.join(','),
      legs_count: verifiedMatches.length,
      stake_per_line: stakePerLine,
      multiple,
      total_stake: preview.totalStake,
      max_potential_return: preview.maxPotentialReturn,
      status: 'pending',
    }).select('id').single();

    if (betErr || !bet) return NextResponse.json({ error: '创建投注失败' }, { status: 500 });

    // 创建 bet_legs
    const legRows: { id: string; matchId: string; selection: string }[] = [];
    for (const sm of verifiedMatches) {
      for (const sel of sm.selections) {
        const { data: legRow } = await admin.from('bet_legs').insert({
          bet_id: bet.id,
          match_id: sm.matchId,
          market_id: sm.marketId,
          market_type: sm.marketType,
          selection: sel.selection,
          odds_snapshot: sel.odds,
          result_status: 'pending',
        }).select('id').single();
        if (legRow) legRows.push({ id: legRow.id, matchId: sm.matchId, selection: sel.selection });
      }
    }

    // 创建 bet_lines
    for (const line of preview.lines) {
      const legIdsForLine: string[] = [];
      const matchIdsForLine: string[] = [];
      for (const matchId of line.legMatchIds) {
        const leg = legRows.find(l => l.matchId === matchId);
        if (leg) { legIdsForLine.push(leg.id); matchIdsForLine.push(matchId); }
      }
      await admin.from('bet_lines').insert({
        bet_id: bet.id,
        pass_type: line.passType,
        leg_ids: legIdsForLine,
        leg_match_ids: matchIdsForLine,
        line_odds: line.lineOdds,
        line_return: line.lineReturn,
        status: 'pending',
      });
    }

    // 扣除金币
    await adjustPoints(user.id, -preview.totalStake, 'parlay stake', bet.id);

    return NextResponse.json({
      betId: bet.id,
      totalStake: preview.totalStake,
      numberOfLines: preview.numberOfLines,
      maxPotentialReturn: preview.maxPotentialReturn,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'service error';
    const code = msg === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
