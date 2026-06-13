'use client';
import { useState } from 'react';

export default function RegisterPage() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password, inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '注册失败');
        return;
      }
      window.location.href = '/home';
    } catch {
      setError('网络异常');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-20 animate-fade-in">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-3xl">
          ⚽
        </div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">邀请注册</h1>
        <p className="mt-2 text-sm text-zinc-400">输入好友邀请码加入竞猜</p>
      </div>
      <form onSubmit={handleSubmit} className="glass-card-static space-y-5 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-500">邀请码</label>
          <input
            className="input-field"
            placeholder="请输入邀请码"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-500">昵称</label>
          <input
            className="input-field"
            placeholder="给自己取个名字"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-500">密码</label>
          <input
            type="password"
            className="input-field"
            placeholder="设置密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <div className="rounded-xl bg-accent/[0.06] px-4 py-3 text-sm font-medium text-accent animate-fade-in">
            {error}
          </div>
        )}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? '注册中…' : '注册'}
        </button>
      </form>
    </div>
  );
}
