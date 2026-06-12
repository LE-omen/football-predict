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
      setMsg(!res.ok ? (data.error || 'failed') : 'done');
    } catch { setMsg('network error'); } finally { setSubmitting(false); }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10 text-white/60">loading...</div>;
  if (!match) return <div className="mx-auto max-w-3xl px-4 py-10 text-red-400">match not found</div>;

  return (
    <AdminGuard>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">settle match</h1>
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="font-semibold">{match.home_team} vs {match.away_team}</div>
          <div className="mt-1 text-sm text-white/60">status: {match.status}</div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-semibold">FT score</h2>
            <div className="flex items-center gap-3">
              <input placeholder="home" className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center" value={ftHome} onChange={(e) => setFtHome(e.target.value)} />
              <span>-</span>
              <input placeholder="away" className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center" value={ftAway} onChange={(e) => setFtAway(e.target.value)} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-semibold">HT score</h2>
            <div className="flex items-center gap-3">
              <input placeholder="home" className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center" value={htHome} onChange={(e) => setHtHome(e.target.value)} />
              <span>-</span>
              <input placeholder="away" className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center" value={htAway} onChange={(e) => setHtAway(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button onClick={settle} disabled={submitting || match.status === 'settled'} className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
            {match.status === 'settled' ? 'settled' : submitting ? '...' : 'settle'}
          </button>
          {msg && <span className="text-sm text-white/70">{msg}</span>}
        </div>
      </div>
    </AdminGuard>
  );
}