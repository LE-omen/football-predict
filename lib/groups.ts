// lib/groups.ts
// 2026 FIFA World Cup group stage data + standings computation
// Groups sourced from official lazq API (competitionTanId=75, rounds G27970A-L)

export interface GroupTeam {
  name: string;
  fifaRank: number;
}

export interface GroupDef {
  letter: string;
  teams: GroupTeam[];
}

export interface TeamStanding {
  team: string;
  fifaRank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export const WC2026_GROUPS: GroupDef[] = [
  {
    letter: 'A',
    teams: [
      { name: '墨西哥', fifaRank: 15 },
      { name: '南非', fifaRank: 45 },
      { name: '韩国', fifaRank: 23 },
      { name: '捷克', fifaRank: 38 },
    ],
  },
  {
    letter: 'B',
    teams: [
      { name: '加拿大', fifaRank: 24 },
      { name: '波黑', fifaRank: 36 },
      { name: '卡塔尔', fifaRank: 38 },
      { name: '瑞士', fifaRank: 17 },
    ],
  },
  {
    letter: 'C',
    teams: [
      { name: '巴西', fifaRank: 6 },
      { name: '摩洛哥', fifaRank: 11 },
      { name: '海地', fifaRank: 48 },
      { name: '苏格兰', fifaRank: 33 },
    ],
  },
  {
    letter: 'D',
    teams: [
      { name: '美国', fifaRank: 16 },
      { name: '巴拉圭', fifaRank: 31 },
      { name: '澳大利亚', fifaRank: 32 },
      { name: '土耳其', fifaRank: 21 },
    ],
  },
  {
    letter: 'E',
    teams: [
      { name: '德国', fifaRank: 8 },
      { name: '库拉索', fifaRank: 47 },
      { name: '科特迪瓦', fifaRank: 27 },
      { name: '厄瓜多尔', fifaRank: 19 },
    ],
  },
  {
    letter: 'F',
    teams: [
      { name: '荷兰', fifaRank: 9 },
      { name: '日本', fifaRank: 14 },
      { name: '瑞典', fifaRank: 25 },
      { name: '突尼斯', fifaRank: 35 },
    ],
  },
  {
    letter: 'G',
    teams: [
      { name: '比利时', fifaRank: 10 },
      { name: '埃及', fifaRank: 29 },
      { name: '伊朗', fifaRank: 26 },
      { name: '新西兰', fifaRank: 93 },
    ],
  },
  {
    letter: 'H',
    teams: [
      { name: '西班牙', fifaRank: 1 },
      { name: '佛得角', fifaRank: 46 },
      { name: '沙特阿拉伯', fifaRank: 37 },
      { name: '乌拉圭', fifaRank: 12 },
    ],
  },
  {
    letter: 'I',
    teams: [
      { name: '法国', fifaRank: 2 },
      { name: '塞内加尔', fifaRank: 18 },
      { name: '伊拉克', fifaRank: 42 },
      { name: '挪威', fifaRank: 20 },
    ],
  },
  {
    letter: 'J',
    teams: [
      { name: '阿根廷', fifaRank: 3 },
      { name: '阿尔及利亚', fifaRank: 28 },
      { name: '奥地利', fifaRank: 22 },
      { name: '约旦', fifaRank: 39 },
    ],
  },
  {
    letter: 'K',
    teams: [
      { name: '葡萄牙', fifaRank: 5 },
      { name: '刚果民主共和国', fifaRank: 43 },
      { name: '乌兹别克斯坦', fifaRank: 44 },
      { name: '哥伦比亚', fifaRank: 7 },
    ],
  },
  {
    letter: 'L',
    teams: [
      { name: '英格兰', fifaRank: 4 },
      { name: '克罗地亚', fifaRank: 13 },
      { name: '加纳', fifaRank: 30 },
      { name: '巴拿马', fifaRank: 40 },
    ],
  },
];

/**
 * Compute group standings from a list of settled match results.
 */
export function computeGroupStandings(
  settledMatches: {
    home_team: string;
    away_team: string;
    ft_home_goals: number;
    ft_away_goals: number;
  }[],
): Map<string, TeamStanding[]> {
  const standingsMap = new Map<string, Map<string, TeamStanding>>();

  for (const group of WC2026_GROUPS) {
    const teamMap = new Map<string, TeamStanding>();
    for (const t of group.teams) {
      teamMap.set(t.name, {
        team: t.name,
        fifaRank: t.fifaRank,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
      });
    }
    standingsMap.set(group.letter, teamMap);
  }

  const teamToGroup = new Map<string, string>();
  for (const group of WC2026_GROUPS) {
    for (const t of group.teams) {
      teamToGroup.set(t.name, group.letter);
    }
  }

  for (const m of settledMatches) {
    const gHome = teamToGroup.get(m.home_team);
    const gAway = teamToGroup.get(m.away_team);
    if (!gHome || gHome !== gAway) continue;

    const groupStandings = standingsMap.get(gHome);
    if (!groupStandings) continue;

    const homeStanding = groupStandings.get(m.home_team);
    const awayStanding = groupStandings.get(m.away_team);
    if (!homeStanding || !awayStanding) continue;

    const hg = m.ft_home_goals;
    const ag = m.ft_away_goals;

    homeStanding.played++;
    awayStanding.played++;
    homeStanding.goalsFor += hg;
    homeStanding.goalsAgainst += ag;
    awayStanding.goalsFor += ag;
    awayStanding.goalsAgainst += hg;

    if (hg > ag) {
      homeStanding.won++;
      homeStanding.points += 3;
      awayStanding.lost++;
    } else if (hg === ag) {
      homeStanding.drawn++;
      awayStanding.drawn++;
      homeStanding.points += 1;
      awayStanding.points += 1;
    } else {
      awayStanding.won++;
      awayStanding.points += 3;
      homeStanding.lost++;
    }
  }

  const result = new Map<string, TeamStanding[]>();
  for (const group of WC2026_GROUPS) {
    const teamMap = standingsMap.get(group.letter)!;
    const standings = Array.from(teamMap.values());
    for (const s of standings) {
      s.goalDiff = s.goalsFor - s.goalsAgainst;
    }
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.fifaRank - b.fifaRank;
    });
    result.set(group.letter, standings);
  }

  return result;
}
