'use client';

import { predictionStatusLabel } from '../types/prediction';
import type { PredictionHistoryItem } from '../types/prediction';

type Props = { items: PredictionHistoryItem[] };

export default function PredictionHistory({ items }: Props) {
  if (!items.length)
    return (
      <div className="glass-card-static py-16 text-center text-zinc-400">
        暂无预测记录
      </div>
    );

  return (
    <div className="space-y-3">
      {items.map((p) => (
        <div key={p.id} className="glass-card-static p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-900">{p.match_title}</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                p.status === 'won'
                  ? 'bg-green-50 text-green-600'
                  : p.status === 'lost'
                    ? 'bg-accent/[0.08] text-accent'
                    : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {predictionStatusLabel[p.status]}
            </span>
          </div>
          <div className="mt-2 text-sm text-zinc-500">
            {p.market_title}：
            <span className="font-medium text-zinc-700">{p.selected_option_label}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
            <span>
              投入{' '}
              <span className="font-medium text-zinc-600">{p.stake_points}</span>
            </span>
            <span>
              倍率{' '}
              <span className="font-medium text-zinc-600">{p.multiplier.toFixed(2)}x</span>
            </span>
            <span>
              返还{' '}
              <span className={`font-bold ${p.payout_points > 0 ? 'text-accent' : 'text-zinc-400'}`}>
                {p.payout_points}
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
