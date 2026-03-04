"use client";

import type { Card as CardType, CardSecret, TeamColor } from "@/engine/types";
import clsx from "clsx";

type Props = {
  card: CardType;
  secretForDisplay: CardSecret | null; // public: null if hidden; master: actual secret
  onClick?: () => void;
  disabled?: boolean;
  teamColorById?: Record<string, TeamColor>;
};

function secretBg(secret: CardSecret | null, teamColorById?: Record<string, TeamColor>) {
  if (!secret) return "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800";
  if (secret.kind === "NEUTRAL") return "bg-amber-100 dark:bg-amber-950";
  if (secret.kind === "ASSASSIN") return "bg-black text-white";
  if (secret.kind === "AGENT") {
    const color = teamColorById?.[secret.teamId] ?? "red";
    if (color === "red") return "bg-red-600 text-white";
    if (color === "blue") return "bg-blue-600 text-white";
    if (color === "green") return "bg-green-600 text-white";
    if (color === "yellow") return "bg-yellow-400 text-black";
  }
  return "bg-zinc-200";
}

export function CardTile({ card, secretForDisplay, onClick, disabled, teamColorById }: Props) {
  const revealed = card.revealedByTeamId !== null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "relative flex aspect-[4/3] w-full select-none items-center justify-center rounded-lg border px-2 text-center text-sm font-semibold tracking-wide transition",
        revealed ? "border-transparent" : "border-zinc-200 dark:border-zinc-800",
        secretBg(revealed ? card.secret : secretForDisplay, teamColorById),
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <span className={clsx("uppercase", revealed && card.secret.kind === "ASSASSIN" && "text-white")}>
        {card.word}
      </span>
      {secretForDisplay && !revealed ? (
        <span className="absolute right-1 top-1 rounded bg-white/70 px-1 text-[10px] font-bold text-black">
          {secretForDisplay.kind === "AGENT"
            ? secretForDisplay.teamId.toUpperCase()
            : secretForDisplay.kind}
        </span>
      ) : null}
    </button>
  );
}

