// app/matches/page.tsx
// 赛程页面 v2：左侧比赛列表+赔率，右侧/底部投注单，支持复式多选
'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { BetSlipProvider, useBetSlip } from '../../lib/betSlipContext';
import BetSlip from '../../components/betting/BetSlip';
import TeamFlag from '../../components/TeamFlag';
import ReliefButton from '../../components/ReliefButton';
import { getTeamRank } from '../../lib/rankings';
import type { MatchItem } from '../../types/match';
import type { MarketItem } from '../../types/market';

function MatchRow({ match, markets, multiMode }: { match: MatchItem; markets: MarketItem[]; multiMode: boolean }) {
  const { addOption, isSelected } = useBetSlip();
  const isSettled = match.status === 'settled';
  const m1x2 = markets.find(m => m.market_type === '1x2');

  if (!m1x2 || isSettled) {
    return (
      <Link href={`/matches/${match.id}`} className="block rounded-xl border border-gray-100 bg-white p-4 hover:shadow-md hover:border-red-200 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">{match.stage ?? '世界杯'}</span>
          <span className="text-xs text-gray-400">{new Date(match.start_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} {new Date(match.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-right">
            <span className="text-xs text-red-400 font-bold mr-1">{getTeamRank(match.home_team) ? `No.${getTeamRank(match.home_team)}` : ''}</span>
            <span className="mr-1"><TeamFlag team={match.home_team} /></span>
            <span className="font-bold text-gray-900">{match.home_team}</span>
          </div>
          <div className="text-center min-w-[50px]">
            {match.status === 'settled' && match.ft_home_goals != null ? (
              <span className="text-lg font-black text-red-500">{match.ft_home_goals}:{match.ft_away_goals}</span>
            ) : (<span className="text-gray-300 font-bold">VS</span>)}
          </div>
          <div className="flex-1 text-left">
            <span className="font-bold text-gray-900">{match.away_team}</span>
            <span className="ml-1"><TeamFlag team={match.away_team} /></span>
            <span className="text-xs text-red-400 font-bold ml-1">{getTeamRank(match.away_team) ? `No.${getTeamRank(match.away_team)}` : ''}</span>
          </div>
        </div>
        {isSettled && <div className="mt-2 text-center text-xs text-gray-400">已结算</div>}
      </Link>
    );
  }

  const odds = m1x2.option_odds ?? {};
  const opts: { key: string; label: string; oddsVal: string }[] = [
    { key: 'home', label: '主胜', oddsVal: odds['home'] ?? m1x2.multiplier.toFixed(2) },
    { key: 'draw', label: '平', oddsVal: odds['draw'] ?? m1x2.multiplier.toFixed(2) },
    { key: 'away', label: '客胜', oddsVal: odds['away'] ?? m1x2.multiplier.toFixed(2) },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 hover:shadow-md hover:border-red-200 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{match.stage ?? '世界杯'}</span>
          <span className="text-xs text-gray-400">{new Date(match.start_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} {new Date(match.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <Link href={`/matches/${match.id}`} className="text-xs text-red-400 hover:text-red-500">详情 &gt;</Link>
      </div>
      <div className="flex items-center justify-center gap-4 mb-3">
        <div className="flex-1 text-right">
          <span className="text-xs text-red-400 font-bold mr-1">{getTeamRank(match.home_team) ? `No.${getTeamRank(match.home_team)}` : ''}</span>
          <span className="mr-1"><TeamFlag team={match.home_team} /></span>
          <span className="font-bold text-gray-900">{match.home_team}</span>
        </div>
        <div className="text-gray-300 font-bold">VS</div>
        <div className="flex-1 text-left">
          <span className="font-bold text-gray-900">{match.away_team}</span>
          <span className="ml-1"><TeamFlag team={match.away_team} /></span>
          <span className="text-xs text-red-400 font-bold ml-1">{getTeamRank(match.away_team) ? `No.${getTeamRank(match.away_team)}` : ''}</span>
        </div>
      </div>
      <div className="flex gap-2">
        {opts.map(o => {
          const selected = isSelected(match.id, '1x2', o.key);
          return (
            <button key={o.key}
              onClick={() => addOption(
                match.id, `${match.home_team} vs ${match.away_team}`,
                m1x2.id, '1x2',
                { selection: o.key, odds: parseFloat(o.oddsVal), label: o.label },
                multiMode,
              )}
              className={`flex-1 rounded-lg py-2 text-center transition ${
                selected ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
              }`}>
              <div className="text-xs font-medium">{o.label}</div>
              <div className="text-sm font-black">{parseFloat(o.oddsVal).toFixed(2)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchesContent() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [markets, setMarkets] = useState<Record<string, MarketItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'result'>('upcoming');
  const [multiMode, setMultiMode] = useState(false);
  const { matchCount } = useBetSlip();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => { if (d?.user?.points !== undefined) setUserPoints(d.user.points); }).catch(() => {});
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => {
        const ms: MatchItem[] = d.matches ?? [];
        setMatches(ms);
        const upcoming = ms.filter(m => m.status === 'scheduled' || m.status === 'locked');
        Promise.all(upcoming.map(m =>
          fetch(`/api/matches/${m.id}`).then(r => r.json()).then(d => ({ matchId: m.id, markets: d.markets ?? [] }))
        )).then(results => {
          const map: Record<string, MarketItem[]> = {};
          for (const r of results) map[r.matchId] = r.markets;
          setMarkets(map);
        }).catch(() => {});
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'upcoming') return matches.filter(m => m.status === 'scheduled' || m.status === 'locked');
    return matches.filter(m => m.status === 'settled');
  }, [matches, tab]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-black text-gray-900">⚽ 赛程</h1>
        {matchCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-1 animate-bounce">已选 {matchCount} 场</span>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('upcoming')} className={`rounded-xl px-5 py-2 text-sm font-bold transition ${tab === 'upcoming' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          当前赛程
        </button>
        <button onClick={() => setTab('result')} className={`rounded-xl px-5 py-2 text-sm font-bold transition ${tab === 'result' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          赛果
        </button>
        {tab === 'upcoming' && (
          <button onClick={() => setMultiMode(v => !v)}
            className={`ml-2 rounded-xl px-4 py-2 text-xs font-bold transition ${multiMode ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'}`}>
            {multiMode ? '复式已开' : '复式多选'}
          </button>
        )}
        <span className="ml-auto self-center text-xs text-gray-400">{filtered.length} 场</span>
      </div>
      {multiMode && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          💡 复式模式：同一场比赛可以选择多个结果，系统自动展开为所有组合
        </div>
      )}

      {userPoints !== null && (
        <div className="mb-4">
          <ReliefButton points={userPoints} onClaimed={(p) => setUserPoints(p)} />
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              <div className="text-sm">加载中...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
              {tab === 'upcoming' ? '暂无待参与的比赛' : '暂无已结算的比赛'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map(m => (
                <MatchRow key={m.id} match={m} markets={markets[m.id] ?? []} multiMode={multiMode} />
              ))}
            </div>
          )}
        </div>

        {/* 桌面端投注单 */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-20"><BetSlip /></div>
        </div>
      </div>

      {/* 移动端底部 */}
      {matchCount > 0 && <MobileBetDrawer />}
    </div>
  );
}

function MobileBetDrawer() {
  const [open, setOpen] = useState(false);
  const { matchCount } = useBetSlip();

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <button onClick={() => setOpen(true)}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 flex items-center justify-between shadow-lg">
          <span className="font-bold text-sm">🎯 投注单 · 已选 {matchCount} 场</span>
          <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">展开</span>
        </button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-gray-900">投注单</span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">收起</button>
            </div>
            <div className="p-4"><BetSlip /></div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MatchesPage() {
  return (
    <BetSlipProvider>
      <MatchesContent />
    </BetSlipProvider>
  );
}




