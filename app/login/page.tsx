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
      <div className="mb-8 text-center">
        <div className="text-4xl mb-3">⚽</div>
        <h1 className="text-2xl font-black text-gray-900">登录</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">昵称</label>
          <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="请输入昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">密码</label>
          <input type="password" className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-red-600 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50">{loading ? '登录中...' : '登录'}</button>
      </form>
    </div>
  );
}