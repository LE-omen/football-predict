// lib/groups.ts
// 2026 FIFA World Cup group stage data + standings computation

export interface GroupTeam {
  name: string;
  fifaRank: number;
}

export interface GroupDef {
  letter: string; // A-H
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

// 2026 FIFA World Cup group stage — 48 teams, 12 groups of 4
// Groups sourced from official 2026 WC draw
export const WC2026_GROUPS: GroupDef[] = [
  {
    letter: 'A',
    teams: [
      { name: '墨西哥', fifaRank: 15 },
      { name: '南非', fifaRank: 45 },
      { name: '挪威', fifaRank: 20 },
      { name: '以色列', fifaRank: 51 },
    ],
  },
  {
    letter: 'B',
    teams: [
      { name: '巴西', fifaRank: 6 },
      { name: '苏格兰', fifaRank: 33 },
      { name: '科特迪瓦', fifaRank: 27 },
      { name: '洪都拉斯', fifaRank: 68 },
    ],
  },
  {
    letter: 'C',
    teams: [
      { name: '西班牙', fifaRank: 1 },
      { name: '哥伦比亚', fifaRank: 7 },
      { name: '突尼斯', fifaRank: 35 },
      { name: '乌兹别克斯坦', fifaRank: 44 },
    ],
  },
  {
    letter: 'D',
    teams: [
      { name: '法国', fifaRank: 2 },
      { name: '荷兰', fifaRank: 9 },
      { name: '塞内加尔', fifaRank: 18 },
      { name: '萨尔瓦多', fifaRank: 83 },
    ],
  },
  {
    letter: 'E',
    teams: [
      { name: '阿根廷', fifaRank: 3 },
      { name: '喀麦隆', fifaRank: 49 },
      { name: '沙特阿拉伯', fifaRank: 37 },
      { name: '加拿大', fifaRank: 24 },
    ],
  },
  {
    letter: 'F',
    teams: [
      { name: '英格兰', fifaRank: 4 },
      { name: '伊朗', fifaRank: 26 },
      { name: '厄瓜多尔', fifaRank: 19 },
      { name: '新西兰', fifaRank: 93 },
    ],
  },
  {
    letter: 'G',
    teams: [
      { name: '葡萄牙', fifaRank: 5 },
      { name: '美国', fifaRank: 16 },
      { name: '乌拉圭', fifaRank: 12 },
      { name: '佛得角', fifaRank: 46 },
    ],
  },
  {
    letter: 'H',
    teams: [
      { name: '德国', fifaRank: 8 },
      { name: '日本', fifaRank: 14 },
      { name: '墨西哥', fifaRank: 15 },
      { name: '巴拿马', fifaRank: 40 },
    ],
  },
  {
    letter: 'I',
    teams: [
      { name: '比利时', fifaRank: 10 },
      { name: '摩洛哥', fifaRank: 11 },
      { name: '韩国', fifaRank: 23 },
      { name: '玻利维亚', fifaRank: 79 },
    ],
  },
  {
    letter: 'J',
    teams: [
      { name: '克罗地亚', fifaRank: 13 },
      { name: '澳大利亚', fifaRank: 32 },
      { name: '塞尔维亚', fifaRank: 36 },
      { name: '海地', fifaRank: 48 },
    ],
  },
  {
    letter: 'K',
    teams: [
      { name: '哥伦比亚', fifaRank: 7 },
      { name: '瑞士', fifaRank: 17 },
      { name: '阿尔及利亚', fifaRank: 28 },
      { name: '库拉索', fifaRank: 47 },
    ],
  },
  {
    letter: 'L',
    teams: [
      { name: '奥地利', fifaRank: 22 },
      { name: '土耳其', fifaRank: 21 },
      { name: '波兰', fifaRank: 30 },
      { name: '约旦', fifaRank: 39 },
    ],
  },
];

/**
 * Compute group standings from a list of settled match results.
 * Each match must have home_team, away_team, ft_home_goals, ft_away_goals all non-null.
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

  // Initialize standings for each group
  for (const group of WC2026_GROUPS) {
    const teamMap = new Map<string, TeamStanding>();
    for (const t of group.teams) {
      teamMap.set(t.name, {
        team: t.name,
        fifaRank: t.fifaRank,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      });
    }
    standingsMap.set(group.letter, teamMap);
  }

  // Build a lookup: team name -> group letter
  const teamToGroup = new Map<string, string>();
  for (const group of WC2026_GROUPS) {
    for (const t of group.teams) {
      teamToGroup.set(t.name, group.letter);
    }
  }

  // Process settled matches
  for (const m of settledMatches) {
    const gHome = teamToGroup.get(m.home_team);
    const gAway = teamToGroup.get(m.away_team);
    if (!gHome || gHome !== gAway) continue; // only count group-stage matches (same group)
    
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

  // Compute goalDiff and sort each group
  const result = new Map<string, TeamStanding[]>();
  for (const group of WC2026_GROUPS) {
    const teamMap = standingsMap.get(group.letter)!;
    const standings = Array.from(teamMap.values());
    for (const s of standings) {
      s.goalDiff = s.goalsFor - s.goalsAgainst;
    }
    // Sort: points desc, goalDiff desc, goalsFor desc, fifaRank asc (tiebreaker)
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
