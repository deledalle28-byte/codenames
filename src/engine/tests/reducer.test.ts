import { describe, expect, test } from "vitest";
import { reduce } from "../reducer";
import type { GameState } from "../types";

function createBase(): GameState {
  return reduce(null, {
    type: "CREATE_MATCH",
    payload: {
      seed: 42,
      config: { teamsCount: 2, roundsToWinMatch: 3, forbiddenClueExtraWords: [] },
      players: [
        { name: "R1", teamId: "red" },
        { name: "R2", teamId: "red" },
        { name: "B1", teamId: "blue" },
        { name: "B2", teamId: "blue" },
      ],
    },
  });
}

describe("reducer", () => {
  test("CREATE_MATCH démarre en phase CLUE", () => {
    const state = createBase();
    expect(state.phase).toBe("CLUE");
    expect(state.cards).toHaveLength(36);
  });

  test("GIVE_CLUE passe en phase GUESS avec guesses = count+1", () => {
    const state = createBase();
    const next = reduce(state, {
      type: "GIVE_CLUE",
      payload: { text: "océan", count: 2 },
    });
    expect(next.phase).toBe("GUESS");
    expect(next.clue?.guessesRemaining).toBe(3);
  });

  test("REVEAL_CARD sur neutre termine le tour (retour CLUE) et change d'équipe active", () => {
    let state = createBase();
    state = reduce(state, { type: "GIVE_CLUE", payload: { text: "océan", count: 1 } });

    const neutral = state.cards.find((c) => c.secret.kind === "NEUTRAL" && !c.revealedByTeamId);
    expect(neutral).toBeTruthy();

    const activeBefore = state.activeTeamId;
    const next = reduce(state, { type: "REVEAL_CARD", payload: { cardId: neutral!.id } });
    expect(next.phase).toBe("CLUE");
    expect(next.activeTeamId).not.toBe(activeBefore);
  });

  test("REVEAL_CARD sur assassin déclenche fin de manche", () => {
    let state = createBase();
    state = reduce(state, { type: "GIVE_CLUE", payload: { text: "océan", count: 1 } });

    const assassin = state.cards.find((c) => c.secret.kind === "ASSASSIN")!;
    const next = reduce(state, { type: "REVEAL_CARD", payload: { cardId: assassin.id } });
    expect(next.phase).toBe("ROUND_OVER");
    expect(next.roundWinnerTeamId).toBeTruthy();
  });
});

