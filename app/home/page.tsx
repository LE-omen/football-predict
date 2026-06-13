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
        setReliefMsg(data.error || '棰嗗彇澶辫触');
      } else {
        setReliefMsg('棰嗗彇鎴愬姛锛?);
        setUser((prev) => (prev ? { ...prev, points: data.points } : prev));
      }
    } catch {
      setReliefMsg('缃戠粶寮傚父');
    } finally {
      setReliefLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="relative mx-auto max-w-xl px-4 py-24 text-center animate-fade-in">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-5xl">
          鈿?        </div>
        <h1 className="mb-3 text-4xl font-black tracking-tight text-gray-900">
          瓒崇悆棰勬祴
        </h1>
        <p className="mb-2 text-lg text-gray-500">
          濂藉弸涔嬮棿鐨勪笘鐣屾澂璧涙灉棰勬祴绉垎绔?        </p>
        <p className="mb-10 text-sm text-gray-400">
          铏氭嫙绉垎 路 绾睘濞变箰 路 涓嶆秹鍙婄湡瀹炶揣甯?        </p>

        {/* 鐜╂硶璇存槑 - 鏈櫥褰曚篃灞曠ず */}
        <div className="mb-10 text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">馃搵 鐜╂硶璇存槑</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">1</span>
              <span>浣跨敤<strong>閭€璇风爜</strong>娉ㄥ唽锛屾瘡浜鸿幏寰?<strong className="text-red-500">10,000</strong> 鍒濆绉垎</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">2</span>
              <span>杩涘叆璧涚▼閫夋嫨姣旇禌锛屽彲棰勬祴<strong>鑳滃钩璐熴€佹瘮鍒嗐€佽繘鐞冩暟銆佸弻鏂规槸鍚﹁繘鐞冦€佸崐鍦鸿儨骞宠礋</strong>鍏?5 绉嶇帺娉?/span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">3</span>
              <span>姣忔鎶曞叆 <strong>100~5,000</strong> 绉垎锛?00 鐨勫€嶆暟锛夛紝鍗曞満涓婇檺 5,000 绉垎</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">4</span>
              <span>姣旇禌<strong>寮€璧涘墠 30 鍒嗛挓閿佸畾</strong>锛屼箣鍚庝笉鍙啀鍙備笌</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">5</span>
              <span>鍛戒腑鍚庢寜<strong>鎶曞叆绉垎 脳 鍙傝€冩寚鏁?/strong>杩旇繕锛屾湭鍛戒腑涓嶈繑杩?/span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">6</span>
              <span>绉垎浣庝簬 100 鍙鍙?strong>姣忔棩琛ョ粰</strong>锛屾瘡娆?1,000 绉垎锛屾瘡澶╂渶澶?3 娆?/span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link href="/login" className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
            鐧诲綍
          </Link>
          <Link href="/register" className="bg-red-500 text-white font-semibold rounded-lg px-6 py-2.5 text-sm shadow-sm hover:bg-red-600 transition">
            閭€璇锋敞鍐?          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      {/* 娆㈣繋鍗＄墖 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm relative mb-6 overflow-hidden p-6">
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">娆㈣繋鍥炴潵</div>
            <div className="mt-1 text-3xl font-black tracking-tight text-gray-900">
              {user.nickname}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-2xl font-black text-red-500">
                {user.points.toLocaleString('zh-CN')}
              </span>
              <span className="text-sm font-medium text-gray-400">绉垎</span>
            </div>
          </div>
          <button
            onClick={claimRelief}
            disabled={reliefLoading}
            className="bg-red-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm shadow-sm hover:bg-red-600 transition disabled:opacity-50"
          >
            {reliefLoading ? '棰嗗彇涓€? : '姣忔棩琛ョ粰'}
          </button>
        </div>
        {reliefMsg && (
          <div className="relative mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500 animate-fade-in">
            {reliefMsg}
          </div>
        )}
      </div>

      {/* 蹇嵎鍏ュ彛 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
        <Link href="/matches" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all animate-slide-up">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">馃彑锔?/div>
          <div className="text-sm font-bold text-gray-900">璧涚▼</div>
          <div className="mt-0.5 text-xs text-gray-400">鏌ョ湅姣旇禌骞舵彁浜ら娴?/div>
        </Link>
        <Link href="/leaderboard" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all animate-slide-up">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">馃弳</div>
          <div className="text-sm font-bold text-gray-900">濂藉弸绉垎姒?/div>
          <div className="mt-0.5 text-xs text-gray-400">鐪嬬湅璋侀鍏?/div>
        </Link>
        <Link href="/my" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all animate-slide-up">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">馃搳</div>
          <div className="text-sm font-bold text-gray-900">鎴戠殑棰勬祴</div>
          <div className="mt-0.5 text-xs text-gray-400">棰勬祴璁板綍涓庣Н鍒嗘祦姘?/div>
        </Link>
      </div>

      {/* FIFA 瀹炲姏鎺掑悕鍏ュ彛 */}
      <Link href='/rankings' className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all mb-6 block'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='text-base font-bold text-gray-900'>馃弳 FIFA 瀹炲姏鎺掑悕</div>
            <div className='mt-1 text-xs text-gray-400'>48 鏀弬璧涢槦瀹炲姏鍒嗘。锛岀偣鍑绘煡鐪嬪畬鏁存鍗?/div>
          </div>
          <div className='text-gray-300 text-lg'>鈫?/div>
        </div>
        <div className='mt-3 flex flex-wrap gap-1.5'>
          {['瑗跨彮鐗?,'娉曞浗','闃挎牴寤?,'鑻辨牸鍏?,'钁¤悇鐗?,'宸磋タ'].map(t => (
            <span key={t} className='bg-gray-50 text-gray-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium'>
              No.{[1,2,3,4,5,6][['瑗跨彮鐗?,'娉曞浗','闃挎牴寤?,'鑻辨牸鍏?,'钁¤悇鐗?,'宸磋タ'].indexOf(t)]} {t}
            </span>
          ))}
        </div>
      </Link>

      {/* 鐜╂硶璇存槑 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">馃搵 鐜╂硶璇存槑</h2>
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">1</span>
            <span>浣跨敤<strong>閭€璇风爜</strong>娉ㄥ唽锛屾瘡浜鸿幏寰?<strong className="text-red-500">10,000</strong> 鍒濆绉垎</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">2</span>
            <span>杩涘叆璧涚▼閫夋嫨姣旇禌锛屽彲棰勬祴<strong>鑳滃钩璐熴€佹瘮鍒嗐€佽繘鐞冩暟銆佸弻鏂规槸鍚﹁繘鐞冦€佸崐鍦鸿儨骞宠礋</strong>鍏?5 绉嶇帺娉?/span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">3</span>
            <span>姣忔鎶曞叆 <strong>100~5,000</strong> 绉垎锛?00 鐨勫€嶆暟锛夛紝鍗曞満涓婇檺 5,000 绉垎</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">4</span>
            <span>姣旇禌<strong>寮€璧涘墠 30 鍒嗛挓閿佸畾</strong>锛屼箣鍚庝笉鍙啀鍙備笌</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">5</span>
            <span>鍛戒腑鍚庢寜<strong>鎶曞叆绉垎 脳 鍙傝€冩寚鏁?/strong>杩旇繕锛屾湭鍛戒腑涓嶈繑杩?/span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">6</span>
            <span>绉垎浣庝簬 100 鍙鍙?strong>姣忔棩琛ョ粰</strong>锛屾瘡娆?1,000 绉垎锛屾瘡澶╂渶澶?3 娆?/span>
          </div>
        </div>
      </div>
    </div>
  );
}