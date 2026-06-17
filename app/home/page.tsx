'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SafeUser } from '../../types/user';

export default function HomePage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [reliefMsg, setReliefMsg] = useState('');
  const [reliefLoading, setReliefLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function claimRelief() {
    setReliefLoading(true);
    setReliefMsg('');
    try {
      const res = await fetch('/api/relief', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setReliefMsg(data.error || '��ȡʧ��');
      } else {
        setReliefMsg('��ȡ�ɹ���');
        setUser((prev) => (prev ? { ...prev, points: data.points } : prev));
      }
    } catch {
      setReliefMsg('�����쳣');
    } finally {
      setReliefLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="relative mx-auto max-w-xl px-4 py-24 text-center animate-fade-in">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-5xl">
          ?
        </div>
        <h1 className="mb-3 text-4xl font-black tracking-tight text-gray-900">
          ����Ԥ��
        </h1>
        <p className="mb-2 text-lg text-gray-500">
          ����֮������籭����Ԥ����վ
        </p>
        <p className="mb-10 text-sm text-gray-400">
          ������ �� �������� �� ���漰��ʵ����
        </p>
        <div className="mb-10 text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">?? �淨˵��</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">1</span>
              <span>ʹ��<strong>������</strong>ע�ᣬÿ�˻�� <strong className="text-red-500">10,000</strong> ��ʼ���</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">2</span>
              <span>��������ѡ���������Ԥ��<strong>ʤƽ�����ȷ֡���������˫���Ƿ����</strong>�� 5 ���淨</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">3</span>
              <span>ÿ��Ͷ�� <strong>100~5,000</strong> ��ң�100 �ı�����������������Ͷ��</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">4</span>
              <span>����<strong>����ǰ 30 ��������</strong>��֮�󲻿��ٲ���</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">5</span>
              <span>���к�<strong>Ͷ���� �� �ο�ָ��</strong>������δ���в�����</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">6</span>
              <span>��ҵ��� 100 ����ȡ<strong>ÿ�ղ���</strong>��ÿ�� 1,000 ��ң�ÿ����� 3 ��</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login" className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
            ��¼
          </Link>
          <Link href="/register" className="bg-red-500 text-white font-semibold rounded-lg px-6 py-2.5 text-sm shadow-sm hover:bg-red-600 transition">
            ����ע��
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm relative mb-6 overflow-hidden p-6">
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">��ӭ����</div>
            <div className="mt-1 text-3xl font-black tracking-tight text-gray-900">{user.nickname}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-2xl font-black text-red-500">?? {user.points.toLocaleString('zh-CN')}</span>
              <span className="text-sm font-medium text-gray-400">���</span>
            </div>
          </div>
          <button onClick={claimRelief} disabled={reliefLoading}
            className="bg-red-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm shadow-sm hover:bg-red-600 transition disabled:opacity-50">
            {reliefLoading ? '��ȡ�С�' : 'ÿ�ղ���'}
          </button>
        </div>
        {reliefMsg && (
          <div className="relative mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500 animate-fade-in">{reliefMsg}</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
        <Link href="/matches" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all animate-slide-up">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">???</div>
          <div className="text-sm font-bold text-gray-900">����</div>
          <div className="mt-0.5 text-xs text-gray-400">�鿴�������ύԤ��</div>
        </Link>
        <Link href="/leaderboard" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all animate-slide-up">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">??</div>
          <div className="text-sm font-bold text-gray-900">���ѽ�Ұ�</div>
          <div className="mt-0.5 text-xs text-gray-400">����˭����</div>
        </Link>
        <Link href="/my" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all animate-slide-up">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">??</div>
          <div className="text-sm font-bold text-gray-900">�ҵ�Ԥ��</div>
          <div className="mt-0.5 text-xs text-gray-400">Ԥ���¼������ˮ</div>
        </Link>
      </div>

      <Link href="/rankings" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all mb-6 block">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-gray-900">?? FIFAʵ������</div>
            <div className="mt-1 text-xs text-gray-400">48 ֧������ʵ���ֵ�������鿴������</div>
          </div>
          <div className="text-gray-300 text-lg">��</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { rank: 1, name: '������' }, { rank: 2, name: '����' }, { rank: 3, name: '����͢' },
            { rank: 4, name: 'Ӣ����' }, { rank: 5, name: '������' }, { rank: 6, name: '����' },
          ].map(t => (
            <span key={t.name} className="bg-gray-50 text-gray-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
              No.{t.rank} {t.name}
            </span>
          ))}
        </div>
      </Link>


      <Link href="/groups" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all mb-6 block">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-gray-900">?? ������ְ�</div>
            <div className="mt-1 text-xs text-gray-400">���籭С����ʵʱ��������������鿴������</div>
          </div>
          <div className="text-gray-300 text-lg">��</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['A', 'B', 'C', 'D', 'E', 'F'].map(g => (
            <span key={g} className="bg-gray-50 text-gray-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
              {g} ��
            </span>
          ))}
        </div>
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">?? �淨˵��</h2>
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">1</span>
            <span>ʹ��<strong>������</strong>ע�ᣬÿ�˻�� <strong className="text-red-500">10,000</strong> ��ʼ���</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">2</span>
            <span>��������ѡ���������Ԥ��<strong>ʤƽ�����ȷ֡���������˫���Ƿ����</strong>�� 5 ���淨</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">3</span>
            <span>ÿ��Ͷ�� <strong>100~5,000</strong> ��ң�100 �ı�����������������Ͷ��</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">4</span>
            <span>����<strong>����ǰ 30 ��������</strong>��֮�󲻿��ٲ���</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">5</span>
            <span>���к�<strong>Ͷ���� �� �ο�ָ��</strong>������δ���в�����</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">6</span>
            <span>��ҵ��� 100 ����ȡ<strong>ÿ�ղ���</strong>��ÿ�� 1,000 ��ң�ÿ����� 3 ��</span>
          </div>
        </div>
      </div>
    </div>
  );
}