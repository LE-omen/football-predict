'use client';

import { predictionStatusLabel } from '../types/prediction';
import type { PredictionHistoryItem } from '../types/prediction';

type Props = { items: PredictionHistoryItem[] };

export default function PredictionHistory({ items }: Props) {
  if (!items.length) return <div className="py-10 text-center text-gray-400">暂无预测记录</div>;
  return (
    <div className="space-y-3">
      {items.map((p) => (
        <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700">{p.match_title}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              p.status === 'won' ? 'bg-green-50 text-green-600' : p.status === 'lost' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
            }`}>{predictionStatusLabel[p.status]}</span>
          </div>
          <div className="mt-2 text-sm text-gray-800">{p.market_title}：<span className="font-medium">{p.selected_option_label}</span></div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>投入 <span className="font-medium text-gray-700">{p.stake_points}</span></span>
            <span>倍率 <span className="font-medium text-gray-700">{p.multiplier.toFixed(2)}x</span></span>
            <span>返还 <span className={`font-medium ${p.payout_points > 0 ? 'text-red-600' : 'text-gray-400'}`}>{p.payout_points}</span></span>
          </div>
        </div>
      ))}
    </div>
  );
}