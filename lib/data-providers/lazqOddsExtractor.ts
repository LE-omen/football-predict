// lib/data-providers/lazqOddsExtractor.ts
// �?lazq 原始数据提取每场比赛每种玩法的每个选项赔率

export interface ExtractedOdds {
  '1x2': Record<string, string>;       // home, draw, away
  exact_score: Record<string, string>; // 0-0, 1-0, ...
  total_goals: Record<string, string>; // 0, 1, 2, 3, 4, 5, 6, 7+
  btts: Record<string, string>;        // yes, no
  'ht_1x2': Record<string, string>;   // home, draw, away
}

// crs key: s{first}s{second} -> first-second
// s1sa=other_away, s1sd=other_draw, s1sh=other_home
function parseCrsKey(key: string): string | null {
  if (key === 's1sa') return 'other_away';
  if (key === 's1sd') return 'other_draw';
  if (key === 's1sh') return 'other_home';
  const m = key.match(/^s(\d+)s(\d+)$/);
  if (!m) return null;
  return `${parseInt(m[1])}-${parseInt(m[2])}`;
}

function parseTtgKey(key: string): string | null {
  const m = key.match(/^s(\d+)$/);
  if (!m) return null;
  return m[1];
}

function parseHafuToHalf1x2(hafu: Record<string, string>): Record<string, string> {
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

  // 1x2: had.h=home win, had.a=away win
  const had = match.had as Record<string, string> | undefined;
  if (had) {
    if (had.h) result['1x2'].home = had.h;
    if (had.d) result['1x2'].draw = had.d;
    if (had.a) result['1x2'].away = had.a;
  }

  // exact score (crs)
  const crs = match.crs as Record<string, string> | undefined;
  if (crs) {
    for (const [key, odds] of Object.entries(crs)) {
      if (key === 'single') continue;
      const mapped = parseCrsKey(key);
      if (mapped) result.exact_score[mapped] = odds;
    }
  }

  // total goals (ttg)
  const ttg = match.ttg as Record<string, string> | undefined;
  if (ttg) {
    for (const [key, odds] of Object.entries(ttg)) {
      if (key === 'single') continue;
      const goals = parseTtgKey(key);
      if (goals) result.total_goals[goals] = odds;
    }
  }

  // btts: derive from crs
  if (crs) {
    let yesMin = Infinity;
    let noMin = Infinity;
    for (const [key, odds] of Object.entries(crs)) {
      if (key === 'single' || key.startsWith('s1s')) continue;
      const m2 = key.match(/^s(\d+)s(\d+)$/);
      if (!m2) continue;
      const first = parseInt(m2[1]);
      const second = parseInt(m2[2]);
      const val = parseFloat(odds);
      if (first > 0 && second > 0) {
        if (val < yesMin) yesMin = val;
      } else {
        if (val < noMin) noMin = val;
      }
    }
    if (yesMin < Infinity) result.btts.yes = Math.max(1.20, yesMin * 0.15).toFixed(2);
    if (noMin < Infinity) result.btts.no = Math.max(1.20, noMin * 0.25).toFixed(2);
    if (!result.btts.yes) result.btts.yes = '1.85';
    if (!result.btts.no) result.btts.no = '1.85';
  }

  // half time 1x2 (hafu)
  const hafu = match.hafu as Record<string, string> | undefined;
  if (hafu) {
    const half1x2 = parseHafuToHalf1x2(hafu);
    Object.assign(result['ht_1x2'], half1x2);
  }

  return result;
}