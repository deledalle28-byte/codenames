import type { Config } from "./types";

export const DEFAULT_CONFIG: Config = {
  teamsCount: 2,
  playersPerTeam: 2,
  roundsToWinMatch: 3,
  guessesRule: "COUNT_PLUS_ONE",
  assassinShift: "AFTER_FULL_CYCLE",
  assassinShiftSwapTarget: "UNREVEALED_NEUTRAL_ONLY",
  forbiddenClueMode: "SOFT_SUBSTRING",
  forbiddenClueExtraWords: [],
  neutralPercentFor3PlusTeams: 0.35,
};

export function getGridSize(teamsCount: number): number {
  if (teamsCount === 2) return 6;
  if (teamsCount === 3) return 7;
  if (teamsCount === 4) return 8;
  // extensible: fallback roughly teamsCount + 4, clamped
  return Math.max(6, Math.min(10, teamsCount + 4));
}

export function withDefaultConfig(partial?: Partial<Config>): Config {
  return { ...DEFAULT_CONFIG, ...(partial ?? {}) };
}

