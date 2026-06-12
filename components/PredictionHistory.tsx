'use client';

import { predictionStatusLabel } from '../types/prediction';
import type { PredictionHistoryItem } from '../types/prediction';

type Props = { items: PredictionHistoryItem[] };

export default function PredictionHistory({ items }: Props) {
  if (!items.length) return <div className="text-white/60">暂无预测记录</div>;
  return (
    <div className="space-y-3">
      {items.map((p) => (
        <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>{p.match_title}</span>
            <span>{predictionStatusLabel[p.status]}</span>
          </div>
          <div className="mt-1 text-sm text-white/80">{p.market_title}：{p.selected_option_label}</div>
          <div className="mt-1 flex items-center justify-between text-xs text-white/50">
            <span>投入 {p.stake_points}</span>
            <span>倍率 {p.multiplier.toFixed(2)}x</span>
            <span>返还 {p.payout_points}</span>
          </div>
        </div>
      ))}
    </div>
  );
}