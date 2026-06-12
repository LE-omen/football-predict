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
    return <div className="p-6 text-white/60">加载中...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="p-6 text-red-400">无权限访问</div>;
  }

  return <>{children}</>;
}