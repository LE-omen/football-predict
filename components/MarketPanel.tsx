'use client';

import OptionButton from './OptionButton';
import StakeInput from './StakeInput';
import type { MarketItem } from '../types/market';
import { getOptionLabel } from '../types/market';

type Props = {
  market: MarketItem;
  selectedOption: string | null;
  stake: number;
  locked: boolean;
  onSelectOption: (v: string) => void;
  onChangeStake: (v: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  error?: string | null;
};

export default function MarketPanel({
  market, selectedOption, stake, locked, onSelectOption, onChangeStake, onSubmit, submitting, error,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">{market.title}</h3>
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
          参考指数 {market.multiplier.toFixed(2)}x
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {market.options.map((opt) => (
          <OptionButton key={opt} label={getOptionLabel(opt)} active={selectedOption === opt} disabled={locked} onClick={() => onSelectOption(opt)} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <StakeInput value={stake} onChange={onChangeStake} disabled={locked} />
        </div>
        <button disabled={locked || !selectedOption || submitting} onClick={onSubmit} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? '提交中...' : '参与预测'}
        </button>
      </div>
      {market.multiplier === 1.0 && (
        <p className="mt-2 text-[11px] text-white/30">该项目为系统默认参考指数，可由管理员调整。</p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}