'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '登录失败'); return; }
      window.location.href = '/home';
    } catch { setError('网络异常'); } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">登录</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="mb-1 block text-sm text-white/70">昵称</label><input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" value={nickname} onChange={(e) => setNickname(e.target.value)} /></div>
        <div><label className="mb-1 block text-sm text-white/70">密码</label><input type="password" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">{loading ? '登录中...' : '登录'}</button>
      </form>
    </div>
  );
}