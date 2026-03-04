import type { Card, CardSecret, GameState, TeamId } from "./types";

export function isRevealed(card: Card): boolean {
  return card.revealedByTeamId !== null;
}

export function getPublicCardSecret(card: Card): CardSecret | null {
  return isRevealed(card) ? card.secret : null;
}

export function getCardsForPublic(state: GameState): Array<Card & { publicSecret: CardSecret | null }> {
  return state.cards.map((c) => ({ ...c, publicSecret: getPublicCardSecret(c) }));
}

export function getCardsForMaster(state: GameState): Card[] {
  return state.cards;
}

export function getActiveTeam(state: GameState) {
  return state.teams[state.activeTeamId];
}

export function getActiveSpymasterPlayerId(state: GameState): string | null {
  const team = getActiveTeam(state);
  return team.playerIds[team.spymasterIndex] ?? null;
}

export function getTeamAgentsRemaining(state: GameState, teamId: TeamId): number {
  return state.cards.filter(
    (c) =>
      c.secret.kind === "AGENT" &&
      c.secret.teamId === teamId &&
      c.revealedByTeamId === null,
  ).length;
}

