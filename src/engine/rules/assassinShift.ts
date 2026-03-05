import type { Card } from "../types";
import { mulberry32, randInt } from "../random";

export function assassinShift(args: { cards: Card[]; seed: number }): Card[] {
  // Find the unrevealed assassin (skip already-revealed ones from previous hits)
  const assassinIndex = args.cards.findIndex(
    (c) => c.secret.kind === "ASSASSIN" && c.revealedByTeamId === null,
  );
  if (assassinIndex < 0) return args.cards;

  const candidates: number[] = [];
  for (let i = 0; i < args.cards.length; i++) {
    const c = args.cards[i];
    if (c.revealedByTeamId) continue;
    if (c.secret.kind !== "NEUTRAL") continue;
    candidates.push(i);
  }
  if (candidates.length === 0) return args.cards;

  const rng = mulberry32(args.seed);
  const pick = candidates[randInt(rng, 0, candidates.length)];

  if (pick === assassinIndex) return args.cards;

  const next = args.cards.map((c) => ({ ...c, secret: { ...c.secret } as Card["secret"] }));
  const assassinSecret = next[assassinIndex].secret;
  next[assassinIndex].secret = next[pick].secret;
  next[pick].secret = assassinSecret;

  // Safety: ensure exactly one assassin remains
  const assassinCount = next.filter((c) => c.secret.kind === "ASSASSIN").length;
  if (assassinCount !== 1) return args.cards;

  return next;
}

