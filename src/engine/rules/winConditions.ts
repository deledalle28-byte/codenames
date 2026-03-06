import type { Card, GameState, TeamId } from "../types";

export function countAgentsTotal(cards: Card[], teamId: TeamId): number {
  return cards.filter((c) => c.secret.kind === "AGENT" && c.secret.teamId === teamId).length;
}

export function countAgentsRevealed(cards: Card[], teamId: TeamId): number {
  return cards.filter(
    (c) =>
      c.secret.kind === "AGENT" &&
      c.secret.teamId === teamId &&
      c.revealedByTeamId !== null,
  ).length;
}

export function areAllAgentsRevealed(cards: Card[], teamId: TeamId): boolean {
  const total = countAgentsTotal(cards, teamId);
  return total > 0 && countAgentsRevealed(cards, teamId) >= total;
}

export function isMissionCompleted(state: GameState, teamId: TeamId): boolean {
  const mission = state.teams[teamId]?.mission;
  return Boolean(mission?.completed);
}

export function getRoundWinnerTeamId(state: GameState): TeamId | null {
  for (const teamId of state.turnOrderTeamIds) {
    if (areAllAgentsRevealed(state.cards, teamId)) {
      return teamId;
    }
  }
  return null;
}

export function getWinnerIfAssassinRevealed(
  state: GameState,
  revealingTeamId: TeamId,
): TeamId | null {
  // In 2 teams: other team wins. In 3+ teams: first other team in turn order.
  for (const teamId of state.turnOrderTeamIds) {
    if (teamId !== revealingTeamId) return teamId;
  }
  return null;
}

