// lib/data-providers/manualProvider.ts
// Type definitions and stub for admin manual match entry.

export interface ManualMatchInput {
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO 8601
  stage?: string;
  league?: string;
}

export interface ManualMatchResult {
  externalProvider: 'manual';
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  stage: string;
  homeScore: number | null;
  awayScore: number | null;
  halfHomeScore: number | null;
  halfAwayScore: number | null;
}

/**
 * Stub: create a match from admin manual entry.
 * Currently a no-op placeholder - implement DB insert as needed.
 */
export function createManualMatch(input: ManualMatchInput): ManualMatchResult {
  return {
    externalProvider: 'manual',
    externalId: `manual-${Date.now()}`,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    startTime: input.startTime,
    stage: input.stage ?? '',
    homeScore: null,
    awayScore: null,
    halfHomeScore: null,
    halfAwayScore: null,
  };
}