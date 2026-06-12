'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';

type Match = { id: string; league: string | null; stage: string | null; home_team: string; away_team: string; start_time: string; status: string; venue: string | null; raw_status: string | null; api_football_fixture_id: number | null };

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ stage: '', homeTeam: '', awayTeam: '', startTime: '' });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');
  const [season, setSeason] = useState('2026');
  const [syncingFixtures, setSyncingFixtures] = useState(false);
  const [syncingScores, setSyncingScores] = useState(false);
  const [syncingOdds, setSyncingOdds] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  async function load() { setLoading(true); try { const r = await fetch('/api/admin/matches'); const d = await r.json(); setMatches(d.matches ?? []); } catch { setMatches([]); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);

  async function createMatch() {
    setCreating(true); setMsg('');
    try {
      const res = await fetch('/api/admin/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || 'failed'); } else { setMsg('created'); setForm({ stage: '', homeTeam: '', awayTeam: '', startTime: '' }); load(); }
    } catch { setMsg('network error'); } finally { setCreating(false); }
  }

  async function syncFixtures() {
    setSyncingFixtures(true); setSyncMsg('');
    try {
      const res = await fetch('/api/admin/sync-fixtures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ season: Number(season) }) });
      const data = await res.json();
      if (!res.ok) { setSyncMsg(data.error || 'sync failed'); } else { setSyncMsg(`fixtures (season ${data.season}): +${data.created} new, ${data.updated} updated, ${data.skipped} skipped / ${data.total} total`); load(); }
    } catch { setSyncMsg('network error'); } finally { setSyncingFixtures(false); }
  }

  async function syncScores() {
    setSyncingScores(true); setSyncMsg('');
    try {
      const res = await fetch('/api/admin/sync-scores', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setSyncMsg(data.error || 'sync failed'); } else { setSyncMsg(`scores: ${data.updated} updated`); load(); }
    } catch { setSyncMsg('network error'); } finally { setSyncingScores(false); }
  }

  async function syncOdds() {
    setSyncingOdds(true); setSyncMsg('');
    try {
      const res = await fetch('/api/admin/sync-odds', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setSyncMsg(data.error || 'sync failed'); } else { setSyncMsg(`odds: ${data.oddsSaved} saved, ${data.marketsUpdated} markets updated`); load(); }
    } catch { setSyncMsg('network error'); } finally { setSyncingOdds(false); }
  }

  return (
    <AdminGuard>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">比赛管理</h1>

        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h2 className="mb-3 text-lg font-semibold">API-FOOTBALL Sync (World Cup)</h2>
          <div className="mb-3 flex items-center gap-3">
            <label className="text-sm text-white/60">Season:</label>
            <input className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm" value={season} onChange={(e) => setSeason(e.target.value)} />
            <span className="text-xs text-white/40">default 2026, use 2022 to test</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={syncFixtures} disabled={syncingFixtures} className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-50">
              {syncingFixtures ? 'syncing...' : 'Sync Fixtures'}
            </button>
            <button onClick={syncScores} disabled={syncingScores} className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-500 disabled:opacity-50">
              {syncingScores ? 'syncing...' : 'Sync Scores'}
            </button>
            <button onClick={syncOdds} disabled={syncingOdds} className="rounded-xl bg-purple-600 px-4 py-2 text-white hover:bg-purple-500 disabled:opacity-50">
              {syncingOdds ? 'syncing...' : 'Sync Odds'}
            </button>
          </div>
          {syncMsg && <div className="mt-2 text-sm text-white/70">{syncMsg}</div>}
        </div>

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-lg font-semibold">Manual Create</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input placeholder="Stage" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))} />
            <input placeholder="Start time ISO" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            <input placeholder="Home team" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" value={form.homeTeam} onChange={(e) => setForm((f) => ({ ...f, homeTeam: e.target.value }))} />
            <input placeholder="Away team" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" value={form.awayTeam} onChange={(e) => setForm((f) => ({ ...f, awayTeam: e.target.value }))} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button disabled={creating} onClick={createMatch} className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-50">{creating ? '...' : 'Create Match'}</button>
            {msg && <span className="text-sm text-white/70">{msg}</span>}
          </div>
        </div>

        {loading ? <div className="text-white/60">loading...</div> : (
          <div className="space-y-3">{matches.map((m) => (
            <Link key={m.id} href={`/admin/matches/${m.id}`} className="block rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/60">{m.league} {m.stage}</div>
                  <div className="mt-1 font-semibold">{m.home_team} vs {m.away_team}</div>
                  {m.venue && <div className="mt-1 text-xs text-white/50">{m.venue}</div>}
                </div>
                <div className="text-right text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${m.status === 'settled' ? 'bg-green-500/20 text-green-400' : m.status === 'locked' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {m.status}{m.raw_status ? ` (${m.raw_status})` : ''}
                  </span>
                  {m.api_football_fixture_id && <div className="mt-1 text-white/40">API #{m.api_football_fixture_id}</div>}
                </div>
              </div>
            </Link>
          ))}</div>
        )}
      </div>
    </AdminGuard>
  );
}