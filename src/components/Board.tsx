"use client";

import type { Card, CardSecret, TeamColor } from "@/engine/types";
import { CardTile } from "./Card";

type Props<TCard extends Card> = {
  cards: TCard[];
  gridSize: number;
  secretForDisplay: (card: TCard) => CardSecret | null;
  onCardClick?: (card: TCard) => void;
  disabled?: boolean;
  teamColorById?: Record<string, TeamColor>;
};

export function Board<TCard extends Card>({
  cards,
  gridSize,
  secretForDisplay,
  onCardClick,
  disabled,
  teamColorById,
}: Props<TCard>) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
    >
      {cards.map((card) => (
        <CardTile
          key={card.id}
          card={card}
          secretForDisplay={secretForDisplay(card)}
          onClick={onCardClick ? () => onCardClick(card) : undefined}
          disabled={disabled}
          teamColorById={teamColorById}
        />
      ))}
    </div>
  );
}

