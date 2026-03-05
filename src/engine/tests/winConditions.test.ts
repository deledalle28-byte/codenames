import { describe, expect, test } from "vitest";
import { getRoundWinnerTeamId, getWinnerIfAssassinRevealed } from "../rules/winConditions";
import type { GameState } from "../types";

function makeState(): GameState {
  return {
    config: {
      teamsCount: 2,
      playersPerTeam: 2,
      roundsToWinMatch: 3,
      guessesRule: "COUNT_PLUS_ONE",
      assassinShift: "AFTER_FULL_CYCLE",
      assassinShiftSwapTarget: "UNREVEALED_NEUTRAL_ONLY",
      forbiddenClueMode: "SOFT_SUBSTRING",
      forbiddenClueExtraWords: [],
      neutralPercentFor3PlusTeams: 0.35,
    },
    matchId: "m",
    seed: 1,
    gridSize: 2,
    phase: "GUESS",
    cards: [
      { id: "r1", word: "R", secret: { kind: "AGENT", teamId: "red" }, revealedByTeamId: "red" },
      { id: "b1", word: "B", secret: { kind: "AGENT", teamId: "blue" }, revealedByTeamId: null },
      { id: "n", word: "N", secret: { kind: "NEUTRAL" }, revealedByTeamId: null },
      { id: "a", word: "A", secret: { kind: "ASSASSIN" }, revealedByTeamId: null },
    ],
    teams: {
      red: {
        id: "red",
        name: "Rouge",
        color: "red",
        playerIds: ["p1"],
        spymasterIndex: 0,
        roundsWon: 0,
        assassinPenalty: 0,
        mission: {
          definitionId: "m1",
          title: "Mission",
          kind: "PROGRESSIVE",
          trigger: "GIVE_CLUE",
          targetCount: 1,
          progressCount: 0,
          completed: false,
        },
      },
      blue: {
        id: "blue",
        name: "Bleu",
        color: "blue",
        playerIds: ["p2"],
        spymasterIndex: 0,
        roundsWon: 0,
        assassinPenalty: 0,
        mission: {
          definitionId: "m2",
          title: "Mission",
          kind: "PROGRESSIVE",
          trigger: "GIVE_CLUE",
          targetCount: 1,
          progressCount: 1,
          completed: true,
        },
      },
    },
    players: {
      p1: { id: "p1", name: "R1", teamId: "red" },
      p2: { id: "p2", name: "B1", teamId: "blue" },
    },
    turnOrderTeamIds: ["red", "blue"],
    activeTeamId: "red",
    roundIndex: 0,
    turnsInCurrentCycle: 0,
    clue: {
      teamId: "red",
      text: "x",
      count: 1,
      guessesAllowed: 2,
      guessesRemaining: 2,
      byPlayerId: null,
    },
    roundWinnerTeamId: null,
    matchWinnerTeamId: null,
    ownAgentsRevealedThisTurn: 0,
    hadErrorThisTurn: false,
  };
}

describe("winConditions", () => {
  test("pas de victoire si mission non complétée même si tous les agents sont révélés", () => {
    const state = makeState();
    // red a tous ses agents révélés (1/1) mais mission incomplète
    expect(getRoundWinnerTeamId(state)).toBe(null);
  });

  test("winner si assassin révélé = autre équipe (2 équipes)", () => {
    const state = makeState();
    expect(getWinnerIfAssassinRevealed(state, "red")).toBe("blue");
  });
});

