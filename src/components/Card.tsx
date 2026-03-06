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

/* ── Neon colour map ───────────────────────────────────── */
const NEON: Record<string, string> = {
  red: "#ff3b5c",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
};

/* ── Styles for REVEALED cards (both public + master) ─── */
function revealedStyles(
  secret: CardSecret,
  teamColorById?: Record<string, TeamColor>,
): { classes: string; style?: CSSProperties } {
  if (secret.kind === "NEUTRAL")
    return {
      classes: "bg-amber-900/40 border-amber-600/40 text-amber-300/70",
    };

  if (secret.kind === "ASSASSIN")
    return {
      classes: "bg-violet-950/80 border-violet-400/50 text-violet-200",
      style: { animation: "assassin-pulse 2s ease-in-out infinite", boxShadow: "0 0 20px rgba(139,92,246,0.3)" },
    };

  if (secret.kind === "AGENT") {
    const color = teamColorById?.[secret.teamId] ?? "red";
    const neon = NEON[color] ?? NEON.red;
    const map: Record<string, { classes: string; style: CSSProperties }> = {
      red: {
        classes: "bg-red-600/40 border-red-400/60 text-red-100",
        style: { boxShadow: `0 0 18px ${neon}50, inset 0 0 20px ${neon}15` },
      },
      blue: {
        classes: "bg-blue-600/40 border-blue-400/60 text-blue-100",
        style: { boxShadow: `0 0 18px ${neon}50, inset 0 0 20px ${neon}15` },
      },
      green: {
        classes: "bg-green-600/40 border-green-400/60 text-green-100",
        style: { boxShadow: `0 0 18px ${neon}50, inset 0 0 20px ${neon}15` },
      },
      yellow: {
        classes: "bg-yellow-500/40 border-yellow-400/60 text-yellow-100",
        style: { boxShadow: `0 0 18px ${neon}50, inset 0 0 20px ${neon}15` },
      },
    };
    return map[color] ?? map.red;
  }

  return { classes: "bg-white/10 border-white/15" };
}

/* ── Styles for UNREVEALED cards on master view ────────── */
function masterUnrevealedStyles(
  secret: CardSecret,
  teamColorById?: Record<string, TeamColor>,
): { classes: string; style?: CSSProperties } {
  if (secret.kind === "NEUTRAL")
    return {
      classes: "bg-amber-900/15 border-amber-700/25 border-dashed",
    };

  if (secret.kind === "ASSASSIN")
    return {
      classes: "bg-violet-950/40 border-violet-500/30 border-dashed",
      style: { boxShadow: "0 0 8px rgba(139,92,246,0.15)" },
    };

  if (secret.kind === "AGENT") {
    const color = teamColorById?.[secret.teamId] ?? "red";
    const neon = NEON[color] ?? NEON.red;
    const map: Record<string, { classes: string; style: CSSProperties }> = {
      red: {
        classes: "bg-red-950/30 border-red-500/25 border-dashed",
        style: { boxShadow: `0 0 6px ${neon}20` },
      },
      blue: {
        classes: "bg-blue-950/30 border-blue-500/25 border-dashed",
        style: { boxShadow: `0 0 6px ${neon}20` },
      },
      green: {
        classes: "bg-green-950/30 border-green-500/25 border-dashed",
        style: { boxShadow: `0 0 6px ${neon}20` },
      },
      yellow: {
        classes: "bg-yellow-950/30 border-yellow-500/25 border-dashed",
        style: { boxShadow: `0 0 6px ${neon}20` },
      },
    };
    return map[color] ?? map.red;
  }

  return { classes: "bg-white/[0.04] border-white/[0.08]" };
}

/* ── Badge colour helpers for master secret tag ────────── */
function badgeClasses(secret: CardSecret, teamColorById?: Record<string, TeamColor>): string {
  if (secret.kind === "NEUTRAL") return "bg-amber-800/70 text-amber-200 border-amber-600/40";
  if (secret.kind === "ASSASSIN") return "bg-violet-800/80 text-violet-100 border-violet-500/40";
  if (secret.kind === "AGENT") {
    const color = teamColorById?.[secret.teamId] ?? "red";
    const m: Record<string, string> = {
      red: "bg-red-800/70 text-red-100 border-red-500/40",
      blue: "bg-blue-800/70 text-blue-100 border-blue-500/40",
      green: "bg-green-800/70 text-green-100 border-green-500/40",
      yellow: "bg-yellow-800/70 text-yellow-100 border-yellow-500/40",
    };
    return m[color] ?? m.red;
  }
  return "bg-black/60 text-white/80 border-white/10";
}

function badgeLabel(secret: CardSecret): string {
  if (secret.kind === "AGENT") return secret.teamId.toUpperCase();
  if (secret.kind === "ASSASSIN") return "ASSASSIN";
  return "NEUTRE";
}

/* ── Main component ────────────────────────────────────── */

export function CardTile({ card, secretForDisplay, onClick, disabled, teamColorById }: Props) {
  const revealed = card.revealedByTeamId !== null;
  const isMasterView = secretForDisplay !== null;

  let classes: string;
  let style: CSSProperties | undefined;

  if (revealed) {
    // Card already picked → strong visual feedback
    const r = revealedStyles(card.secret, teamColorById);
    classes = r.classes;
    style = r.style;
  } else if (isMasterView && secretForDisplay) {
    // Master sees unrevealed cards with subtle team hint
    const m = masterUnrevealedStyles(secretForDisplay, teamColorById);
    classes = m.classes;
    style = m.style;
  } else {
    // Public: unrevealed, no secret visible
    classes = "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || revealed}
      className={clsx(
        "relative flex aspect-[4/3] w-full select-none items-center justify-center overflow-hidden rounded-xl border px-2 text-center text-[11px] font-semibold tracking-wide uppercase transition-all duration-300 ease-out sm:text-sm",
        classes,
        (disabled || revealed) && !revealed && "opacity-50 cursor-not-allowed",
      )}
      style={{
        ...style,
        ...(revealed ? { animation: "card-reveal 0.4s ease-out" } : {}),
      }}
    >
      {/* Word text — dimmed + line-through when revealed */}
      <span
        className={clsx(
          "relative z-10 transition-all duration-300",
          revealed && "line-through opacity-60",
        )}
      >
        {card.word}
      </span>

      {/* ✓ checkmark overlay when revealed */}
      {revealed && (
        <span className="absolute inset-0 z-20 flex items-center justify-center">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-lg backdrop-blur-sm sm:h-8 sm:w-8"
            style={{ animation: "card-reveal 0.3s ease-out" }}
          >
            {card.secret.kind === "ASSASSIN" ? "💀" : "✓"}
          </span>
        </span>
      )}

      {/* Master view: secret badge (top-right) — bigger and colour-coded */}
      {secretForDisplay && !revealed ? (
        <span
          className={clsx(
            "absolute right-1 top-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider backdrop-blur-sm border sm:text-[9px]",
            badgeClasses(secretForDisplay, teamColorById),
          )}
        >
          {badgeLabel(secretForDisplay)}
        </span>
      ) : null}

      {/* Revealed badge on master view — show which team revealed it */}
      {revealed && isMasterView && (
        <span
          className={clsx(
            "absolute left-1 bottom-1 rounded px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider backdrop-blur-sm border sm:text-[8px]",
            badgeClasses(card.secret, teamColorById),
          )}
        >
          {badgeLabel(card.secret)}
        </span>
      )}
    </button>
  );
}
