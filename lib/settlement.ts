// lib/settlement.ts
import { createAdminClient } from './supabase/admin';
import { is1x2Hit, isExactScoreHit, isTotalGoalsHit, isBttsHit, isHt1x2Hit, calcPayout, getEffectiveMultiplier } from './markets';
import { adjustPoints } from './points';

export async function settleMatch(matchId: string) {
  const admin = createAdminClient();
  const { data: match, error: matchErr } = await admin.from('matches').select('*').eq('id', matchId).single();
  if (matchErr || !match) throw new Error('match not found');
  if (match.status === 'settled') throw new Error('already settled');
  if (match.ft_home_goals == null || match.ft_away_goals == null) throw new Error('set FT score first');

  const { data: markets } = await admin.from('markets').select('*').eq('match_id', matchId);
  if (!markets || markets.length === 0) throw new Error('no markets');

  for (const market of markets) {
    const { data: preds } = await admin.from('predictions').select('*').eq('market_id', market.id);
    if (!preds || preds.length === 0) {
      await admin.from('markets').update({ market_result: 'void' }).eq('id', market.id);
      continue;
    }

    let anyWon = false;
    for (const pred of preds) {
      const hit = isMarketHit(market.market_type, {
        ftHome: match.ft_home_goals,
        ftAway: match.ft_away_goals,
        htHome: match.ht_home_goals ?? 0,
        htAway: match.ht_away_goals ?? 0,
        selected: pred.selected_option,
      });
      // 使用选项独立赔率计算返还
      const effectiveMult = getEffectiveMultiplier(market, pred.selected_option);
      const payout = hit ? calcPayout(pred.stake_points, effectiveMult) : 0;
      const status = hit ? 'won' : 'lost';
      await admin.from('predictions').update({ status, payout_points: payout }).eq('id', pred.id);
      if (hit && payout > 0) {
        anyWon = true;
        await adjustPoints(pred.user_id, payout, '命中返还', pred.id);
      }
    }
    await admin.from('markets').update({ market_result: anyWon ? 'won' : 'lost' }).eq('id', market.id);
  }

  await admin.from('matches').update({ status: 'settled' }).eq('id', matchId);
  return { ok: true };
}

function isMarketHit(
  marketType: string,
  args: { ftHome: number; ftAway: number; htHome: number; htAway: number; selected: string },
) {
  switch (marketType) {
    case '1x2': return is1x2Hit(args.ftHome, args.ftAway, args.selected);
    case 'exact_score': return isExactScoreHit(args.ftHome, args.ftAway, args.selected);
    case 'total_goals': return isTotalGoalsHit(args.ftHome, args.ftAway, args.selected);
    case 'btts': return isBttsHit(args.ftHome, args.ftAway, args.selected);
    case 'ht_1x2': return isHt1x2Hit(args.htHome, args.htAway, args.selected);
    default: return false;
  }
}