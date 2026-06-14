'use client';
import { useEffect, useState } from 'react';
import LeaderboardTable from '../../components/LeaderboardTable';

type Row = { id: string; nickname: string; points: number };

export default function LeaderboardPage() {
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <h1 className="section-title mb-6">🏆 好友金币榜</h1>
      {loading ? (
        <div className="py-16 text-center text-zinc-400">
          <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <div className="text-sm">加载中…</div>
        </div>
      ) : (
        <LeaderboardTable users={users} />
      )}
    </div>
  );
}
