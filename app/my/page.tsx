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
    ]).then(([p, t]) => { setPredictions(p.predictions ?? []); setTxs(t.transactions ?? []); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10 text-white/60">加载中...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <section>
        <h1 className="mb-4 text-2xl font-bold">我的预测记录</h1>
        <PredictionHistory items={predictions} />
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold">积分流水</h2>
        {txs.length === 0 ? <div className="text-white/60">暂无流水</div> : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-left text-white/70"><tr><th className="px-4 py-3">时间</th><th className="px-4 py-3">类型</th><th className="px-4 py-3 text-right">变动</th></tr></thead>
              <tbody>{txs.map((t) => (
                <tr key={t.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{new Date(t.created_at).toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3">{t.reason}</td>
                  <td className={`px-4 py-3 text-right ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.amount >= 0 ? '+' : ''}{t.amount}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}