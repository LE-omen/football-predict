// lib/data-providers/lazqOddsExtractor.ts
// 从 lazq 原始数据提取每场比赛每种玩法的每个选项赔率

export interface ExtractedOdds {
  '1x2': Record<string, string>;       // home, draw, away
  exact_score: Record<string, string>; // 0-0, 1-0, ...
  total_goals: Record<string, string>; // 0, 1, 2, 3, 4, 5, 6, 7+
  btts: Record<string, string>;        // yes, no
  'ht_1x2': Record<string, string>;   // home, draw, away
}

// crs key 格式: s{awayGoals}s{homeGoals} — 注意是"客在前主在后"
// s1sa = 其他主胜, s1sd = 其他平局, s1sh = 其他客胜
// s00s00 = 0:0, s01s00 = 0:1(客1主0), s02s01 = 1:2(客2主1)

function parseCrsKey(key: string): string | null {
  // s1sa, s1sd, s1sh -> "other" variants
  if (key === 's1sa') return 'other_away';
  if (key === 's1sd') return 'other_draw';
  if (key === 's1sh') return 'other_home';
  
  // sXXsYY format: XX = away goals, YY = home goals
  const m = key.match(/^s(\d+)s(\d+)$/);
  if (!m) return null;
  const awayGoals = parseInt(m[1]);
  const homeGoals = parseInt(m[2]);
  return `${homeGoals}-${awayGoals}`;
}

function parseTtgKey(key: string): string | null {
  // s0=0球, s1=1球, ... s7=7+球
  const m = key.match(/^s(\d+)$/);
  if (!m) return null;
  return m[1];
}

function parseHafuToHalf1x2(hafu: Record<string, string>): Record<string, string> {
  // hafu: hh=主/主, hd=主/平, ha=主/客, dh=平/主, dd=平/平, da=平/客, ah=客/主, ad=客/平, aa=客/客
  // 半场胜平负只看第一个字母: h=主胜, d=平, a=客胜
  // 取同组最小赔率
  // lazq h=home, a=away for hafu
  const halfHome = Math.min(parseFloat(hafu.hh || '999'), parseFloat(hafu.ha || '999'), parseFloat(hafu.hd || '999'));
  const halfDraw = Math.min(parseFloat(hafu.dh || '999'), parseFloat(hafu.da || '999'), parseFloat(hafu.dd || '999'));
  const halfAway = Math.min(parseFloat(hafu.ah || '999'), parseFloat(hafu.ad || '999'), parseFloat(hafu.aa || '999'));
  
  const result: Record<string, string> = {};
  if (halfHome < 999) result.home = halfHome.toFixed(2);
  if (halfDraw < 999) result.draw = halfDraw.toFixed(2);
  if (halfAway < 999) result.away = halfAway.toFixed(2);
  return result;
}

export function extractOdds(match: Record<string, unknown>): ExtractedOdds {
  const result: ExtractedOdds = {
    '1x2': {},
    exact_score: {},
    total_goals: {},
    btts: {},
    'ht_1x2': {},
  };

  // 1. 胜平负 (had) - lazq h=our away, a=our home -> swap
  const had = match.had as Record<string, string> | undefined;
  if (had) {
    if (had.h) result['1x2'].home = had.h;
    if (had.d) result['1x2'].draw = had.d;
    if (had.a) result['1x2'].away = had.a;
  }

  // 2. 准确比分 (crs)
  const crs = match.crs as Record<string, string> | undefined;
  if (crs) {
    for (const [key, odds] of Object.entries(crs)) {
      if (key === 'single') continue;
      const mapped = parseCrsKey(key);
      if (mapped) result.exact_score[mapped] = odds;
    }
  }

  // 3. 总进球 (ttg) — s0=0球, s1=1球 ... s7=7+球
  const ttg = match.ttg as Record<string, string> | undefined;
  if (ttg) {
    for (const [key, odds] of Object.entries(ttg)) {
      if (key === 'single') continue;
      const goals = parseTtgKey(key);
      if (goals) result.total_goals[goals] = odds;
    }
  }

  // 4. 双方是否进球 (BTTS) — lazq 没有直接提供，从 crs 推算
  // 从比分选项中: 双方都进球的最小赔率 vs 至少一方不进球的最小赔率
  if (crs) {
    let yesMin = Infinity;
    let noMin = Infinity;
    for (const [key, odds] of Object.entries(crs)) {
      if (key === 'single' || key.startsWith('s1s')) continue;
      const m = key.match(/^s(\d+)s(\d+)$/);
      if (!m) continue;
      const away = parseInt(m[1]);
      const home = parseInt(m[2]);
      const val = parseFloat(odds);
      if (home > 0 && away > 0) {
        if (val < yesMin) yesMin = val;
      } else {
        if (val < noMin) noMin = val;
      }
    }
    // 转换为合理赔率 (原始比分赔率很高，BTTS 应该更低)
    if (yesMin < Infinity) result.btts.yes = Math.max(1.20, yesMin * 0.15).toFixed(2);
    if (noMin < Infinity) result.btts.no = Math.max(1.20, noMin * 0.25).toFixed(2);
    // 兜底
    if (!result.btts.yes) result.btts.yes = '1.85';
    if (!result.btts.no) result.btts.no = '1.85';
  }

  // 5. 半场胜平负 (hafu -> 半场 1x2)
  const hafu = match.hafu as Record<string, string> | undefined;
  if (hafu) {
    const half1x2 = parseHafuToHalf1x2(hafu);
    Object.assign(result['ht_1x2'], half1x2);
  }

  return result;
}