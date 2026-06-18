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
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [syncResult, setSyncResult] = useState<any>(null);

  async function load() { setLoading(true); try { const r = await fetch('/api/admin/matches'); const d = await r.json(); setMatches(d.matches ?? []); } catch { setMatches([]); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);

  async function createMatch() {
    setCreating(true); setMsg('');
    try {
      const res = await fetch('/api/admin/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || 'failed'); } else { setMsg('创建成功'); setForm({ stage: '', homeTeam: '', awayTeam: '', startTime: '' }); load(); }
    } catch { setMsg('网络错误'); } finally { setCreating(false); }
  }

  async function syncAndSettle() {
    setSyncing(true); setSyncMsg(''); setSyncResult(null);
    try {
      const res = await fetch('/api/admin/sync-espn-settle', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setSyncMsg(data.error || '同步失败'); } else {
        setSyncResult(data);
        setSyncMsg(data.message || '同步完成');
        load();
      }
    } catch { setSyncMsg('网络错误'); } finally { setSyncing(false); }
  }

  return (
    <AdminGuard>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-black text-gray-900">⚽ 比赛管理</h1>

        {/* 一键同步+结算 */}
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="mb-2 text-lg font-bold text-gray-900">⚽ 比分拉取 & 自动结算</h2>
          <p className="mb-3 text-sm text-gray-500">
            从 ESPN 拉取已完赛比分，并自动结算金币。赚率由 GitHub Actions 定时同步。
          </p>
          <button
            onClick={syncAndSettle}
            disabled={syncing}
            className="rounded-xl bg-red-500 px-6 py-2.5 text-white font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {syncing ? '⏳ 拉取中...' : '⚽ 拉取比分 + 结算'}
          </button>
          {syncMsg && (
            <div className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-700 border border-gray-200">
              {syncMsg}
            </div>
          )}
          {syncResult && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg bg-white p-2 text-center border">
                <div className="text-gray-400">比分更新</div>
                <div className="text-lg font-bold text-gray-900">{syncResult.scoreUpdated ?? 0}</div>
              </div>
              <div className="rounded-lg bg-white p-2 text-center border">
                <div className="text-gray-400">ESPN比赛</div>
                <div className="text-lg font-bold text-gray-900">{syncResult.totalEspn ?? 0}</div>
              </div>
              <div className="rounded-lg bg-white p-2 text-center border">
                <div className="text-gray-400">已结算</div>
                <div className="text-lg font-bold text-green-600">{syncResult.settledMatchesCount ?? 0}</div>
              </div>
              <div className="rounded-lg bg-white p-2 text-center border">
                <div className="text-gray-400">赔率更新</div>
                <div className="text-lg font-bold text-blue-600">{syncResult.oddsBackfilledCount ?? 0}</div>
              </div>
            </div>
          )}
        </div>

        {/* 手动创建 */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold text-gray-900">✏️ 手动创建比赛</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input placeholder="阶段 (如: 小组赛A组)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900" value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))} />
            <input placeholder="开赛时间 ISO" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            <input placeholder="主队" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900" value={form.homeTeam} onChange={(e) => setForm((f) => ({ ...f, homeTeam: e.target.value }))} />
            <input placeholder="客队" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900" value={form.awayTeam} onChange={(e) => setForm((f) => ({ ...f, awayTeam: e.target.value }))} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button disabled={creating} onClick={createMatch} className="rounded-xl bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50">{creating ? '...' : '创建比赛'}</button>
            {msg && <span className="text-sm text-gray-500">{msg}</span>}
          </div>
        </div>

        {/* 比赛列表 */}
        <h2 className="mb-3 text-lg font-bold text-gray-900">📋 全部比赛</h2>
        {loading ? <div className="text-gray-400">加载中...</div> : (
          <div className="space-y-3">{matches.map((m) => (
            <Link key={m.id} href={`/admin/matches/${m.id}`} className="block rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-md hover:border-red-200 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400">{m.stage}</div>
                  <div className="mt-1 font-bold text-gray-900">{m.home_team} vs {m.away_team}</div>
                  <div className="mt-1 text-xs text-gray-400">{new Date(m.start_time).toLocaleString('zh-CN')}</div>
                </div>
                <div className="text-right">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${m.status === 'settled' ? 'bg-green-100 text-green-700' : m.status === 'locked' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {m.status === 'settled' ? '已结算' : m.status === 'locked' ? '已锁定' : '未开始'}
                  </span>
                </div>
              </div>
            </Link>
          ))}</div>
        )}
      </div>
    </AdminGuard>
  );
}
