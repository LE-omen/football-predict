// lib/markets.ts
import type { MarketType } from '../types/database';
import type { MarketItem } from '../types/market';

export function isOptionValidForMarket(market: MarketItem, option: string) {
  return market.options.includes(option);
}

export function displayOption(marketType: MarketType, option: string) {
  return option;
}

/**
 * 计算命中返还: 使用该选项的独立赔 * 计算命中返还: 使用该选项的独立赔率(option_odds)计算
 * 如果没有独立赔率则使用默认倍率(multiplier)* 如果没有独立赔率则使用默认倍率(multiplier)
 */
export function calcPayout(stake: number, multiplier: number): number {
  return Math.round(stake * multiplier);
}

/**
 * 获取某个选项的有效倍率
 */
export function getEffectiveMultiplier(
  market: { multiplier: number; option_odds?: Record<string, string> | null },
  selectedOption: string,
): number {
  const odds = market.option_odds;
  if (odds && odds[selectedOption]) {
    const val = parseFloat(odds[selectedOption]);
    if (!isNaN(val) && val > 0) return val;
  }
  return market.multiplier;
}

export function isExactScoreHit(ftHome: number, ftAway: number, selected: string) {
  if (selected === 'other_home') return ftHome > ftAway && ftHome >= 4;
  if (selected === 'other_draw') return ftHome === ftAway && ftHome >= 4;
  if (selected === 'other_away') return ftAway > ftHome && ftAway >= 4;
  const [h, a] = selected.split('-').map(Number);
  return h === ftHome && a === ftAway;
}

export function is1x2Hit(ftHome: number, ftAway: number, selected: string) {
  if (ftHome === ftAway) return selected === 'draw';
  if (ftHome > ftAway) return selected === 'home';
  return selected === 'away';
}

export function isTotalGoalsHit(ftHome: number, ftAway: number, selected: string) {
  const total = ftHome + ftAway;
  // selected: '0','1','2','3','4','5','6','7+'
  if (selected === '7+') return total >= 7;
  return total === parseInt(selected);
}

export function isBttsHit(ftHome: number, ftAway: number, selected: string) {
  const both = ftHome > 0 && ftAway > 0;
  return selected === (both ? 'yes' : 'no');
}

export function isHt1x2Hit(htHome: number, htAway: number, selected: string) {
  if (htHome === htAway) return selected === 'draw';
  if (htHome > htAway) return selected === 'home';
  return selected === 'away';
}