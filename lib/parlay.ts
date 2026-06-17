// lib/parlay.ts
// 串关计算引擎 v2：支持 M串N、复式多选、混合过关
// 统一流程：选择项按比赛分组 → 复式笛卡尔积展开 → 按 passType 展开 M串N → 逐注计算赔率和回报

import type { MarketType } from '../types/database';

/** 四舍五入到2位小数 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** 组合算法：从 arr 中选 k 个的所有组合 */
export function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(combo => [first, ...combo]),
    ...combinations(rest, k),
  ];
}

/** 笛卡尔积：多组选项展开为所有组合 */
export function cartesianProduct<T>(groups: T[][]): T[][] {
  return groups.reduce<T[][]>(
    (acc, group) => acc.flatMap(prev => group.map(item => [...prev, item])),
    [[]],
  );
}

// ─── M串N 配置表 ───
// key = passType, value = 该 passType 包含的所有关次（2串1、3串1等）
export const PASS_TYPE_MAP: Record<string, number[]> = {
  // 自由过关
  '2x1': [2],
  '3x1': [3],
  '4x1': [4],
  '5x1': [5],
  '6x1': [6],
  '7x1': [7],
  '8x1': [8],
  // 3场
  '3x3': [2],
  '3x4': [2, 3],
  // 4场
  '4x4': [3],
  '4x5': [3, 4],
  '4x6': [2],
  '4x11': [2, 3, 4],
  // 5场
  '5x5': [4],
  '5x6': [4, 5],
  '5x10': [2],
  '5x16': [3, 4, 5],
  '5x20': [2, 3],
  '5x26': [2, 3, 4, 5],
  // 6场
  '6x6': [5],
  '6x7': [5, 6],
  '6x15': [2],
  '6x20': [3],
  '6x22': [4, 5, 6],
  '6x35': [2, 3],
  '6x42': [3, 4, 5, 6],
  '6x50': [2, 3, 4],
  '6x57': [2, 3, 4, 5, 6],
  // 7场
  '7x7': [6],
  '7x8': [6, 7],
  '7x21': [5],
  '7x35': [4],
  '7x120': [2, 3, 4, 5, 6, 7],
  // 8场
  '8x8': [7],
  '8x9': [7, 8],
  '8x28': [6],
  '8x56': [5],
  '8x70': [4],
  '8x247': [2, 3, 4, 5, 6, 7, 8],
};

// ─── 混合过关规则 ───
// 不同玩法的最大串关数不同
export const MAX_PASS_BY_MARKET_TYPE: Record<string, number> = {
  '1x2': 8,
  exact_score: 4,
  total_goals: 6,
  btts: 6,
  ht_1x2: 6,
};

/** 获取混合过关的最大串关数（取所有涉及玩法中的最小值） */
export function getMaxPassForMixed(marketTypes: string[]): number {
  return Math.min(...marketTypes.map(t => MAX_PASS_BY_MARKET_TYPE[t] ?? 6));
}

/** 获取可用的过关方式列表 */
export function getAvailablePassTypes(matchCount: number, marketTypes?: string[]): string[] {
  const maxPass = marketTypes ? getMaxPassForMixed(marketTypes) : 8;
  const maxN = Math.min(matchCount, maxPass);
  const types: string[] = [];

  // 自由过关
  for (let i = 2; i <= maxN; i++) {
    types.push(`${i}x1`);
  }

  // M串N（3场起）
  const mnpresets: Record<number, string[]> = {
    3: ['3x3', '3x4'],
    4: ['4x4', '4x5', '4x6', '4x11'],
    5: ['5x5', '5x6', '5x10', '5x16', '5x20', '5x26'],
    6: ['6x6', '6x7', '6x15', '6x20', '6x22', '6x35', '6x42', '6x50', '6x57'],
    7: ['7x7', '7x8', '7x21', '7x35', '7x120'],
    8: ['8x8', '8x9', '8x28', '8x56', '8x70', '8x247'],
  };

  for (let n = 3; n <= maxN; n++) {
    if (mnpresets[n]) types.push(...mnpresets[n]);
  }

  return types;
}

/** 计算某个 passType 的总注数 */
export function getPassTypeLineCount(matchCount: number, passType: string): number {
  const passSizes = PASS_TYPE_MAP[passType];
  if (!passSizes) return 0;
  return passSizes.reduce((sum, k) => sum + combinations(Array(matchCount).fill(0), k).length, 0);
}

// ─── 投注腿 ───
export interface ParlayLeg {
  matchId: string;
  marketId: string;
  marketType: MarketType | string;
  selection: string;
  odds: number;
}

// ─── 比赛选择（支持复式多选） ───
export interface SelectedMatch {
  matchId: string;
  marketId: string;
  marketType: string;
  selections: { selection: string; odds: number }[];
}

// ─── 串关线 ───
export interface ParlayLine {
  lineIndex: number;
  passType: string;
  legIndices: number[];
  legMatchIds: string[];
  legIds?: string[];
  lineOdds: number;
  lineReturn: number;
  status: 'pending' | 'won' | 'lost' | 'void';
}

// ─── 预览结果 ───
export interface ParlayPreview {
  lines: ParlayLine[];
  numberOfLines: number;
  totalStake: number;
  maxPotentialReturn: number;
}

/** 展开 passType 为所有组合（M串N） */
export function expandPassType<T>(legs: T[], passType: string): T[][] {
  const passSizes = PASS_TYPE_MAP[passType];
  if (!passSizes) throw new Error(`Unsupported pass type: ${passType}`);
  return passSizes.flatMap(passSize => combinations(legs, passSize));
}

/** 复式多选展开：按比赛分组 → 笛卡尔积 */
export function expandMultipleSelections(selectedMatches: SelectedMatch[]): ParlayLeg[][] {
  const groups = selectedMatches.map(match =>
    match.selections.map(option => ({
      matchId: match.matchId,
      marketId: match.marketId,
      marketType: match.marketType,
      selection: option.selection,
      odds: option.odds,
    })),
  );
  return cartesianProduct(groups);
}

/** 计算完整串关（支持复式 + M串N） */
export function calculateFullParlay({
  selectedMatches,
  passTypes,
  stakePerLine,
  multiple = 1,
}: {
  selectedMatches: SelectedMatch[];
  passTypes: string[];
  stakePerLine: number;
  multiple?: number;
}): ParlayPreview {
  // Step 1: 复式展开
  const expandedTickets = expandMultipleSelections(selectedMatches);

  // Step 2: 对每张单式票按 passType 展开 M串N
  const allLines: ParlayLine[] = [];
  let lineCounter = 0;

  for (const ticket of expandedTickets) {
    for (const passType of passTypes) {
      const combos = expandPassType(ticket, passType);
      for (const combo of combos) {
        lineCounter++;
        const oddsProduct = combo.reduce((acc, leg) => acc * leg.odds, 1);
        const lineOdds = round2(oddsProduct);
        const lineReturn = round2(stakePerLine * lineOdds * multiple);

        allLines.push({
          lineIndex: lineCounter,
          passType,
          legIndices: combo.map(leg => ticket.indexOf(leg)),
          legMatchIds: combo.map(leg => leg.matchId),
          lineOdds,
          lineReturn,
          status: 'pending',
        });
      }
    }
  }

  const totalStake = stakePerLine * allLines.length * multiple;
  const maxPotentialReturn = round2(allLines.reduce((sum, l) => sum + l.lineReturn, 0));

  return {
    lines: allLines,
    numberOfLines: allLines.length,
    totalStake,
    maxPotentialReturn,
  };
}

/** 兼容旧版：简单串关（每场只选一个结果） */
export function calculateParlayLines({
  legs,
  passSize,
  stakePerLine,
  multiple = 1,
}: {
  legs: ParlayLeg[];
  passSize: number;
  stakePerLine: number;
  multiple?: number;
}): ParlayPreview {
  const selectedMatches: SelectedMatch[] = legs.map(leg => ({
    matchId: leg.matchId,
    marketId: leg.marketId,
    marketType: leg.marketType as string,
    selections: [{ selection: leg.selection, odds: leg.odds }],
  }));
  return calculateFullParlay({
    selectedMatches,
    passTypes: [`${passSize}x1`],
    stakePerLine,
    multiple,
  });
}

/** 兼容旧版：多个自由过关 */
export function calculateMultiPass({
  legs,
  passSizes,
  stakePerLine,
  multiple = 1,
}: {
  legs: ParlayLeg[];
  passSizes: number[];
  stakePerLine: number;
  multiple?: number;
}): ParlayPreview {
  const selectedMatches: SelectedMatch[] = legs.map(leg => ({
    matchId: leg.matchId,
    marketId: leg.marketId,
    marketType: leg.marketType as string,
    selections: [{ selection: leg.selection, odds: leg.odds }],
  }));
  return calculateFullParlay({
    selectedMatches,
    passTypes: passSizes.map(p => `${p}x1`),
    stakePerLine,
    multiple,
  });
}

/** 结算时判断一条线的输赢 */
export function settleLine(line: ParlayLine, legResults: Map<string, 'won' | 'lost' | 'void'>): 'won' | 'lost' | 'void' {
  let hasVoid = false;
  for (const legId of line.legIds ?? []) {
    const result = legResults.get(legId);
    if (result === 'lost') return 'lost';
    if (result === 'void') hasVoid = true;
  }
  if (hasVoid) return 'void';
  return 'won';
}
