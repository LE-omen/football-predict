// lib/betSlipContext.tsx
// BetSlip v2：支持复式多选（同一场可选多个结果）
'use client';
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { SelectedMatch } from './parlay';

/** 单个选择项 */
export interface SelectedOption {
  selection: string;
  odds: number;
  label: string;
}

/** 比赛场次选择（支持多选） */
export interface SelectedMatchState {
  matchId: string;
  matchTitle: string;
  marketId: string;
  marketType: string;
  options: SelectedOption[];
}

interface BetSlipState {
  matches: SelectedMatchState[];
  /** 添加或切换选择（默认单选模式：同场同市场替换） */
  addOption: (matchId: string, matchTitle: string, marketId: string, marketType: string, option: SelectedOption, multiSelect?: boolean) => void;
  /** 移除单个选项 */
  removeOption: (matchId: string, marketType: string, selection: string) => void;
  /** 移除整场比赛 */
  removeMatch: (matchId: string) => void;
  /** 清空 */
  clearAll: () => void;
  /** 判断某选项是否已选 */
  isSelected: (matchId: string, marketType: string, selection: string) => boolean;
  /** 转为 SelectedMatch[] 供计算引擎用 */
  toSelectedMatches: () => SelectedMatch[];
  /** 总比赛数 */
  matchCount: number;
}

const BetSlipContext = createContext<BetSlipState | null>(null);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<SelectedMatchState[]>([]);

  const addOption = useCallback((
    matchId: string, matchTitle: string, marketId: string, marketType: string,
    option: SelectedOption, multiSelect = false,
  ) => {
    setMatches(prev => {
      const existing = prev.find(m => m.matchId === matchId && m.marketType === marketType);
      if (existing) {
        const optExists = existing.options.some(o => o.selection === option.selection);
        if (optExists) {
          // 已选中 → 取消该选项
          const newOpts = existing.options.filter(o => o.selection !== option.selection);
          if (newOpts.length === 0) return prev.filter(m => !(m.matchId === matchId && m.marketType === marketType));
          return prev.map(m => m.matchId === matchId && m.marketType === marketType ? { ...m, options: newOpts } : m);
        }
        if (multiSelect) {
          // 复式模式：追加
          return prev.map(m => m.matchId === matchId && m.marketType === marketType ? { ...m, options: [...m.options, option] } : m);
        }
        // 单选模式：替换同市场
        return prev.map(m => m.matchId === matchId && m.marketType === marketType ? { ...m, options: [option] } : m);
      }
      // 新比赛
      return [...prev, { matchId, matchTitle, marketId, marketType, options: [option] }];
    });
  }, []);

  const removeOption = useCallback((matchId: string, marketType: string, selection: string) => {
    setMatches(prev => {
      const m = prev.find(x => x.matchId === matchId && x.marketType === marketType);
      if (!m) return prev;
      const newOpts = m.options.filter(o => o.selection !== selection);
      if (newOpts.length === 0) return prev.filter(x => !(x.matchId === matchId && x.marketType === marketType));
      return prev.map(x => x.matchId === matchId && x.marketType === marketType ? { ...x, options: newOpts } : x);
    });
  }, []);

  const removeMatch = useCallback((matchId: string) => {
    setMatches(prev => prev.filter(m => m.matchId !== matchId));
  }, []);

  const clearAll = useCallback(() => setMatches([]), []);

  const isSelected = useCallback((matchId: string, marketType: string, selection: string) => {
    return matches.some(m => m.matchId === matchId && m.marketType === marketType && m.options.some(o => o.selection === selection));
  }, [matches]);

  const toSelectedMatches = useCallback((): SelectedMatch[] => {
    return matches.map(m => ({
      matchId: m.matchId,
      marketId: m.marketId,
      marketType: m.marketType,
      selections: m.options.map(o => ({ selection: o.selection, odds: o.odds })),
    }));
  }, [matches]);

  const matchCount = useMemo(() => new Set(matches.map(m => m.matchId)).size, [matches]);

  return (
    <BetSlipContext.Provider value={{ matches, addOption, removeOption, removeMatch, clearAll, isSelected, toSelectedMatches, matchCount }}>
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const ctx = useContext(BetSlipContext);
  if (!ctx) throw new Error('useBetSlip must be used within BetSlipProvider');
  return ctx;
}
