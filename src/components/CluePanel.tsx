"use client";

import type { Clue, Phase, Team, TeamColor } from "@/engine/types";

const NEON: Record<TeamColor, string> = {
  red: "#ff3b5c",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
};

const PHASE_LABEL: Record<string, string> = {
  CLUE: "Indice",
  GUESS: "Devinette",
  ROUND_OVER: "Fin de manche",
  MATCH_OVER: "Terminé",
};

export function CluePanel({
  phase,
  activeTeam,
  clue,
}: {
  phase: Phase;
  activeTeam: Team;
  clue: Clue | null;
}) {
  const neon = NEON[activeTeam.color] ?? "#f1f5f9";

  return (
    <div
      className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm"
      style={{ animation: "slide-up 0.3s ease-out" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Équipe active
          </div>
          <div
            className="text-lg font-bold"
            style={{ color: neon, textShadow: `0 0 12px ${neon}40` }}
          >
            {activeTeam.name}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Phase
          </div>
          <div className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-slate-300">
            {PHASE_LABEL[phase] ?? phase}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Indice
          </div>
          <div
            className="mt-1 font-mono text-lg font-bold"
            style={
              clue
                ? { color: neon, textShadow: `0 0 10px ${neon}50` }
                : { color: "#64748b" }
            }
          >
            {clue ? clue.text : "—"}
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Essais restants
          </div>
          <div
            className="mt-1 font-mono text-2xl font-bold"
            style={
              clue
                ? { color: neon, textShadow: `0 0 10px ${neon}50` }
                : { color: "#64748b" }
            }
          >
            {clue ? clue.guessesRemaining : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
