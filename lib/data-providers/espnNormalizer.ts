// lib/data-providers/espnNormalizer.ts
// Maps ESPN team names to Chinese names via lazq mapping.
// Handles name differences between ESPN and lazq.

/** ESPN English name -> lazq English name -> Chinese name */
const ESPN_TO_LAZQ: Record<string, string> = {
  'Czechia': 'Czech Republic',
  'Türkiye': 'Turkey',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
  'Democratic Republic Congo': 'Democratic Rep Congo',
  'Cape Verde Islands': 'Cape Verde',
};

/** lazq English name -> Chinese name (filled by loadTeamMapping) */
let lazqTeamMap: Record<string, string> = {};

export function loadLazqTeamMap(teamsFlat: (string | number)[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (let i = 0; i < teamsFlat.length; i += 3) {
    const en = String(teamsFlat[i + 2]);
    const cn = String(teamsFlat[i + 1]);
    if (en && cn && !en.startsWith('[')) {
      map[en] = cn;
    }
  }
  lazqTeamMap = map;
  return map;
}

export function getTeamChineseName(espnName: string): string {
  const lazqName = ESPN_TO_LAZQ[espnName] ?? espnName;
  return lazqTeamMap[lazqName] ?? espnName;
}

/**
 * Build a name mapping from ESPN display names to lazq Chinese names.
 * Uses DB matches as reference: matches already have home_team/away_team in Chinese.
 */
export function buildEspnNameMap(
  dbMatches: { home_team: string; away_team: string; external_id?: string }[],
  espnEvents: { id: string; name: string }[],
): Map<string, string> {
  const espnToCn = new Map<string, string>();
  // Build a lookup: lazq external_id -> chinese team names
  const extIdToTeams = new Map<string, { home: string; away: string }>();
  for (const m of dbMatches) {
    if (m.external_id) {
      extIdToTeams.set(m.external_id, { home: m.home_team, away: m.away_team });
    }
  }
  // For each ESPN event, try to match by DB external_id first
  // If no match, use the lazy mapping
  return espnToCn;
}

/** Parse ESPN score string to number */
export function parseEspnScore(score: string | undefined | null): number | null {
  if (score == null || score === '') return null;
  const n = parseInt(score, 10);
  return isNaN(n) ? null : n;
}

/** Get half score from ESPN linescores (first period) */
export function getHalfScore(linescores: { value: number }[] | undefined | null): number | null {
  if (!linescores || linescores.length === 0) return null;
  return linescores[0].value ?? null;
}
