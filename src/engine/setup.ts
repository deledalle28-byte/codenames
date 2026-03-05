import { getGridSize } from "./config";
import type { Card, CardSecret, Config, MissionDefinition, Team, TeamId } from "./types";
import { mulberry32, randInt, shuffleInPlace } from "./random";
import { DEFAULT_WORDS } from "./words";
import { DEFAULT_MISSIONS, createMissionState } from "./missions";

function pickUniqueWords(args: { total: number; rng: () => number }): string[] {
  const pool = [...DEFAULT_WORDS];
  shuffleInPlace(pool, args.rng);
  const picked = pool.slice(0, args.total);
  if (picked.length >= args.total) return picked;

  const fallback: string[] = [];
  for (let i = picked.length; i < args.total; i++) fallback.push(`Mot${i + 1}`);
  return [...picked, ...fallback];
}

function computeDistribution(args: {
  config: Config;
  total: number;
  turnOrderTeamIds: TeamId[];
}): { neutrals: number; agentsByTeamId: Record<TeamId, number> } {
  const teamsCount = args.turnOrderTeamIds.length;

  if (teamsCount === 2 && args.total === 36) {
    const [starting, other] = args.turnOrderTeamIds;
    return {
      neutrals: 12,
      agentsByTeamId: { [starting]: 11, [other]: 12 },
    };
  }

  const neutrals = Math.max(0, Math.round(args.total * args.config.neutralPercentFor3PlusTeams));
  const assassin = 1;
  const agentsTotal = Math.max(0, args.total - neutrals - assassin);

  const base = Math.floor(agentsTotal / teamsCount);
  let extra = agentsTotal % teamsCount;

  const agentsByTeamId: Record<TeamId, number> = {};
  const reversed = [...args.turnOrderTeamIds].reverse();
  for (const teamId of reversed) {
    const add = extra > 0 ? 1 : 0;
    agentsByTeamId[teamId] = base + add;
    extra = Math.max(0, extra - add);
  }

  return { neutrals, agentsByTeamId };
}

export function generateBoard(args: {
  seed: number;
  config: Config;
  turnOrderTeamIds: TeamId[];
}): { gridSize: number; cards: Card[] } {
  const gridSize = getGridSize(args.config.teamsCount);
  const total = gridSize * gridSize;
  const rng = mulberry32(args.seed);

  const words = pickUniqueWords({ total, rng });
  shuffleInPlace(words, rng);

  const { neutrals, agentsByTeamId } = computeDistribution({
    config: args.config,
    total,
    turnOrderTeamIds: args.turnOrderTeamIds,
  });

  const secrets: CardSecret[] = [];
  secrets.push({ kind: "ASSASSIN" });
  for (let i = 0; i < neutrals; i++) secrets.push({ kind: "NEUTRAL" });
  for (const teamId of args.turnOrderTeamIds) {
    const count = agentsByTeamId[teamId] ?? 0;
    for (let i = 0; i < count; i++) secrets.push({ kind: "AGENT", teamId });
  }

  // pad (extensible) or trim to fit
  while (secrets.length < total) secrets.push({ kind: "NEUTRAL" });
  if (secrets.length > total) secrets.length = total;

  shuffleInPlace(secrets, rng);

  const cards: Card[] = [];
  for (let i = 0; i < total; i++) {
    cards.push({
      id: `c_${i}`,
      word: words[i],
      secret: secrets[i],
      revealedByTeamId: null,
    });
  }
  return { gridSize, cards };
}

function pickMissionDef(args: { rng: () => number; defs?: MissionDefinition[] }): MissionDefinition {
  const defs = args.defs ?? DEFAULT_MISSIONS;
  return defs[randInt(args.rng, 0, defs.length)];
}

export function assignMissionsForRound(args: {
  teams: Record<TeamId, Team>;
  seed: number;
  defs?: MissionDefinition[];
}): Record<TeamId, Team> {
  const rng = mulberry32(args.seed ^ 0x9e3779b9);
  const next: Record<TeamId, Team> = {};
  for (const [teamId, team] of Object.entries(args.teams)) {
    const def = pickMissionDef({ rng, defs: args.defs });
    next[teamId] = {
      ...team,
      mission: createMissionState(def),
    };
  }
  return next;
}

