'use client';

import { useEffect, useState } from 'react';
import type { SafeUser } from '../types/user';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-zinc-400">
        <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <div className="text-sm">加载中…</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-accent">
        无权访问
      </div>
    );
  }

  return <>{children}</>;
}
