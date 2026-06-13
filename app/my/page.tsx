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

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-10 text-gray-400">加载中...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-8">
      <section>
        <h1 className="mb-4 text-2xl font-black text-gray-900">📊 我的预测</h1>
        <PredictionHistory items={predictions} />
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900">💰 积分流水</h2>
        {txs.length === 0 ? <div className="py-10 text-center text-gray-400">暂无流水</div> : (
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-red-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">时间</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">类型</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">变动</th>
                </tr>
              </thead>
              <tbody>{txs.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-gray-600">{new Date(t.created_at).toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3 text-gray-700">{t.reason}</td>
                  <td className={`px-4 py-3 text-right font-medium ${t.amount >= 0 ? 'text-red-600' : 'text-gray-500'}`}>{t.amount >= 0 ? '+' : ''}{t.amount}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}