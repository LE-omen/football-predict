'use client';

import { STAKE_MIN, STAKE_MAX, STAKE_STEP } from '../lib/constants';

type Props = {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
};

export default function StakeInput({ value, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={STAKE_MIN}
        max={STAKE_MAX}
        step={STAKE_STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="flex-1"
      />
      <input
        type="number"
        min={STAKE_MIN}
        max={STAKE_MAX}
        step={STAKE_STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="input-field w-24 text-right text-sm"
      />
    </div>
  );
}
