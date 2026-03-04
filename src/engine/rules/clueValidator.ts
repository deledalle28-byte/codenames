import type { Card, ClueValidationResult, Config } from "../types";

function normalizeToken(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function normalizeBoardWord(word: string): string {
  // keep spaces/hyphens as-is for substring checks, but collapse multiple spaces
  return normalizeToken(word).replace(/\s+/g, " ");
}

export function validateClue(args: {
  clueText: string;
  cards: Card[];
  config: Pick<Config, "forbiddenClueMode" | "forbiddenClueExtraWords">;
}): ClueValidationResult {
  const clue = normalizeToken(args.clueText);
  if (!clue) return { ok: false, reason: "Indice vide." };

  if (args.config.forbiddenClueMode !== "SOFT_SUBSTRING") {
    return { ok: true };
  }

  const forbiddenList = (args.config.forbiddenClueExtraWords ?? [])
    .map(normalizeToken)
    .filter(Boolean);

  for (const w of forbiddenList) {
    if (clue.includes(w) || w.includes(clue)) {
      return { ok: false, reason: "Indice contient un mot interdit.", matchedWord: w };
    }
  }

  for (const card of args.cards) {
    const word = normalizeBoardWord(card.word);
    if (!word) continue;
    if (clue.includes(word) || word.includes(clue)) {
      return {
        ok: false,
        reason: "Indice trop proche d'un mot du plateau (substring).",
        matchedWord: card.word,
      };
    }
  }

  return { ok: true };
}

