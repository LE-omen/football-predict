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
  market,
  selectedOption,
  stake,
  locked,
  onSelectOption,
  onChangeStake,
  onSubmit,
  submitting,
  error,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">{market.title}</h3>
        <span className="badge-accent text-[10px]">
          参考指数 {market.multiplier.toFixed(2)}x
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {market.options.map((opt) => (
          <OptionButton
            key={opt}
            label={getOptionLabel(opt)}
            active={selectedOption === opt}
            disabled={locked}
            onClick={() => onSelectOption(opt)}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <StakeInput value={stake} onChange={onChangeStake} disabled={locked} />
        </div>
        <button
          disabled={locked || !selectedOption || submitting}
          onClick={onSubmit}
          className="btn-primary text-sm"
        >
          {submitting ? '提交中…' : '参与预测'}
        </button>
      </div>
      {market.multiplier === 1.0 && (
        <p className="mt-2 text-[11px] text-gray-400">
          该项目为系统默认参考指数，可由管理员调整。
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}