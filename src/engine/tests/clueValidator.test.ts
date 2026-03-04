import { describe, expect, test } from "vitest";
import { validateClue } from "../rules/clueValidator";
import type { Card } from "../types";

const cards: Card[] = [
  { id: "c1", word: "École", secret: { kind: "NEUTRAL" }, revealedByTeamId: null },
  { id: "c2", word: "Soleil", secret: { kind: "NEUTRAL" }, revealedByTeamId: null },
  { id: "c3", word: "Château", secret: { kind: "NEUTRAL" }, revealedByTeamId: null },
];

describe("clueValidator (soft substring, accents/casse ignorés)", () => {
  test("refuse si l'indice est substring d'un mot du board (accent/casse ignorés)", () => {
    const res = validateClue({
      clueText: "eco",
      cards,
      config: { forbiddenClueMode: "SOFT_SUBSTRING", forbiddenClueExtraWords: [] },
    });
    expect(res.ok).toBe(false);
  });

  test("refuse si un mot du board est substring de l'indice", () => {
    const res = validateClue({
      clueText: "super soleil magique",
      cards,
      config: { forbiddenClueMode: "SOFT_SUBSTRING", forbiddenClueExtraWords: [] },
    });
    expect(res.ok).toBe(false);
  });

  test("refuse via forbiddenClueExtraWords", () => {
    const res = validateClue({
      clueText: "Chaton",
      cards,
      config: { forbiddenClueMode: "SOFT_SUBSTRING", forbiddenClueExtraWords: ["chat"] },
    });
    expect(res.ok).toBe(false);
  });

  test("accepte un indice sans collision", () => {
    const res = validateClue({
      clueText: "océan",
      cards,
      config: { forbiddenClueMode: "SOFT_SUBSTRING", forbiddenClueExtraWords: [] },
    });
    expect(res.ok).toBe(true);
  });
});

