import { describe, expect, test } from "vitest";
import { assassinShift } from "../rules/assassinShift";
import type { Card } from "../types";

describe("assassinShift", () => {
  test("swap uniquement avec neutre non révélé (si un seul candidat)", () => {
    const cards: Card[] = [
      { id: "a", word: "A", secret: { kind: "ASSASSIN" }, revealedByTeamId: null },
      { id: "n1", word: "N1", secret: { kind: "NEUTRAL" }, revealedByTeamId: "red" }, // révélé => interdit
      { id: "n2", word: "N2", secret: { kind: "NEUTRAL" }, revealedByTeamId: null }, // seul candidat
    ];

    const shifted = assassinShift({ cards, seed: 123 });
    expect(shifted.find((c) => c.id === "n2")?.secret.kind).toBe("ASSASSIN");
    expect(shifted.find((c) => c.id === "a")?.secret.kind).toBe("NEUTRAL");
  });

  test("assassin reste unique", () => {
    const cards: Card[] = [
      { id: "a", word: "A", secret: { kind: "ASSASSIN" }, revealedByTeamId: null },
      { id: "n", word: "N", secret: { kind: "NEUTRAL" }, revealedByTeamId: null },
      { id: "x", word: "X", secret: { kind: "NEUTRAL" }, revealedByTeamId: null },
    ];
    const shifted = assassinShift({ cards, seed: 1 });
    expect(shifted.filter((c) => c.secret.kind === "ASSASSIN")).toHaveLength(1);
  });
});

