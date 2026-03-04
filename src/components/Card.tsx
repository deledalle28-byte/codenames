"use client";

import type { Card as CardType, CardSecret, TeamColor } from "@/engine/types";
import clsx from "clsx";
import type { CSSProperties } from "react";

type Props = {
  card: CardType;
  secretForDisplay: CardSecret | null; // public: null if hidden; master: actual secret
  onClick?: () => void;
  disabled?: boolean;
  teamColorById?: Record<string, TeamColor>;
};

function secretStyles(
  secret: CardSecret | null,
  teamColorById?: Record<string, TeamColor>,
): { classes: string; style?: CSSProperties } {
  // Unrevealed
  if (!secret)
    return {
      classes:
        "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5",
    };

  // Neutral
  if (secret.kind === "NEUTRAL")
    return {
      classes: "bg-amber-900/30 border-amber-700/30 text-amber-200/90",
    };

  // Assassin
  if (secret.kind === "ASSASSIN")
    return {
      classes: "bg-red-950/60 border-red-800/50 text-red-100",
      style: { animation: "assassin-pulse 2s ease-in-out infinite" },
    };

  // Agent by team color
  if (secret.kind === "AGENT") {
    const color = teamColorById?.[secret.teamId] ?? "red";
    const map: Record<string, { classes: string; style: CSSProperties }> = {
      red: {
        classes: "bg-red-600/20 border-red-500/40 text-red-100",
        style: { boxShadow: "var(--neon-red-glow)" },
      },
      blue: {
        classes: "bg-blue-600/20 border-blue-500/40 text-blue-100",
        style: { boxShadow: "var(--neon-blue-glow)" },
      },
      green: {
        classes: "bg-green-600/20 border-green-500/40 text-green-100",
        style: { boxShadow: "var(--neon-green-glow)" },
      },
      yellow: {
        classes: "bg-yellow-500/20 border-yellow-500/40 text-yellow-100",
        style: { boxShadow: "var(--neon-yellow-glow)" },
      },
    };
    return map[color] ?? map.red;
  }

  return { classes: "bg-white/5 border-white/10" };
}

export function CardTile({ card, secretForDisplay, onClick, disabled, teamColorById }: Props) {
  const revealed = card.revealedByTeamId !== null;
  const { classes, style } = secretStyles(
    revealed ? card.secret : secretForDisplay,
    teamColorById,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "relative flex aspect-[4/3] w-full select-none items-center justify-center rounded-xl border px-2 text-center text-[11px] font-semibold tracking-wide uppercase transition-all duration-300 ease-out sm:text-sm",
        classes,
        disabled && "opacity-50 cursor-not-allowed",
      )}
      style={{
        ...style,
        ...(revealed ? { animation: "card-reveal 0.4s ease-out" } : {}),
      }}
    >
      <span className="relative z-10">{card.word}</span>

      {/* Master view: secret badge (top-right) */}
      {secretForDisplay && !revealed ? (
        <span className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[9px] font-bold text-white/80 backdrop-blur-sm border border-white/10">
          {secretForDisplay.kind === "AGENT"
            ? secretForDisplay.teamId.toUpperCase()
            : secretForDisplay.kind}
        </span>
      ) : null}
    </button>
  );
}
