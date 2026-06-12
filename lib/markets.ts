// lib/markets.ts
import type { MarketType } from '../types/database';
import type { MarketItem } from '../types/market';
import { marketOptionLabel } from '../types/market';

export function isOptionValidForMarket(market: MarketItem, option: string) {
  return market.options.includes(option);
}

export function displayOption(marketType: MarketType, option: string) {
  // For exact_score, just pass through like 2-1
  return marketOptionLabel[option] ?? option;
}

export function calcPayout(stake: number, multiplier: number) {
  return Math.round(stake * multiplier);
}

export function isExactScoreHit(ftHome: number, ftAway: number, selected: string) {
  if (selected === 'other') {
    // any score not in predefined set would fall here if admin chooses
    return false;
  }
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
  if (selected === 'over2.5') return total > 2.5;
  return total < 2.5;
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
