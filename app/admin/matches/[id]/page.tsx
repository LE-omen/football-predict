'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminGuard from '../../../../components/AdminGuard';

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  ft_home_goals: number | null;
  ft_away_goals: number | null;
  ht_home_goals: number | null;
  ht_away_goals: number | null;
  status: string;
};

export default function AdminMatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [ftHome, setFtHome] = useState('');
  const [ftAway, setFtAway] = useState('');
  const [htHome, setHtHome] = useState('');
  const [htAway, setHtAway] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/matches/${id}`).then((r) => r.json()).then((d) => {
      setMatch(d.match ?? null);
      if (d.match?.ft_home_goals != null) setFtHome(String(d.match.ft_home_goals));
      if (d.match?.ft_away_goals != null) setFtAway(String(d.match.ft_away_goals));
      if (d.match?.ht_home_goals != null) setHtHome(String(d.match.ht_home_goals));
      if (d.match?.ht_away_goals != null) setHtAway(String(d.match.ht_away_goals));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  async function settle() {
    setSubmitting(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: id, ftHomeGoals: Number(ftHome), ftAwayGoals: Number(ftAway), htHomeGoals: htHome !== '' ? Number(htHome) : null, htAwayGoals: htAway !== '' ? Number(htAway) : null }),
      });
      const data = await res.json();
      setMsg(!res.ok ? (data.error || '操作失败') : '结算成功！');
    } catch { setMsg('网络错误'); } finally { setSubmitting(false); }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10 text-white/60">加载中...</div>;
  if (!match) return <div className="mx-auto max-w-3xl px-4 py-10 text-red-400">比赛不存在</div>;

  return (
    <AdminGuard>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">结算比赛</h1>
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">{match.home_team} vs {match.away_team}</div>
          <div className="mt-1 text-sm text-white/60">状态: {match.status === 'settled' ? '已结算' : match.status === 'locked' ? '已锁定' : '进行中'}</div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-semibold">全场比分</h2>
            <div className="flex items-center gap-3">
              <input placeholder="主队" className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-lg" value={ftHome} onChange={(e) => setFtHome(e.target.value)} />
              <span className="text-xl text-white/50">-</span>
              <input placeholder="客队" className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-lg" value={ftAway} onChange={(e) => setFtAway(e.target.value)} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-semibold">半场比分</h2>
            <div className="flex items-center gap-3">
              <input placeholder="主队" className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-lg" value={htHome} onChange={(e) => setHtHome(e.target.value)} />
              <span className="text-xl text-white/50">-</span>
              <input placeholder="客队" className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-lg" value={htAway} onChange={(e) => setHtAway(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button onClick={settle} disabled={submitting || match.status === 'settled'} className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
            {match.status === 'settled' ? '已结算' : submitting ? '结算中...' : '一键结算'}
          </button>
          {msg && <span className={`text-sm ${msg.includes('成功') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</span>}
        </div>
      </div>
    </AdminGuard>
  );
}