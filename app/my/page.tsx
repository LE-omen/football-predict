'use client';
import { useEffect, useState } from 'react';
import type { PredictionHistoryItem } from '../../types/prediction';
import PredictionHistory from '../../components/PredictionHistory';

type Tx = { id: string; amount: number; reason: string; created_at: string };

export default function MyPage() {
  const [predictions, setPredictions] = useState<PredictionHistoryItem[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/mypredictions').then((r) => (r.ok ? r.json() : { predictions: [] })),
      fetch('/api/points-history').then((r) => (r.ok ? r.json() : { transactions: [] })),
    ])
      .then(([p, t]) => {
        setPredictions(p.predictions ?? []);
        setTxs(t.transactions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-zinc-400">
        <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <div className="text-sm">加载中…</div>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-8 animate-fade-in">
      <section>
        <h1 className="section-title mb-5">📊 我的预测</h1>
        <PredictionHistory items={predictions} />
      </section>
      <section>
        <h2 className="mb-5 text-xl font-bold tracking-tight text-zinc-900">💰 积分流水</h2>
        {txs.length === 0 ? (
          <div className="glass-card-static py-16 text-center text-zinc-400">暂无流水</div>
        ) : (
          <div className="glass-card-static overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">时间</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">类型</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">变动</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id} className="border-t border-black/[0.04] transition hover:bg-accent/[0.02]">
                    <td className="px-5 py-3.5 text-zinc-500">
                      {new Date(t.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">{t.reason}</td>
                    <td className={`px-5 py-3.5 text-right font-bold ${t.amount >= 0 ? 'text-accent' : 'text-zinc-400'}`}>
                      {t.amount >= 0 ? '+' : ''}
                      {t.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
