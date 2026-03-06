"use client";

import { useEffect, useState } from "react";
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

function CountdownTimer({ deadline }: { deadline: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline - Date.now()));

  useEffect(() => {
    setRemaining(Math.max(0, deadline - Date.now()));
    const interval = setInterval(() => {
      const r = Math.max(0, deadline - Date.now());
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [deadline]);

  const totalSec = Math.ceil(remaining / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const isLow = totalSec <= 30;
  const isCritical = totalSec <= 10;

  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2"
      style={{
        borderColor: isCritical
          ? "rgba(255,59,92,0.4)"
          : isLow
            ? "rgba(250,204,21,0.3)"
            : "rgba(255,255,255,0.08)",
        backgroundColor: isCritical
          ? "rgba(255,59,92,0.08)"
          : isLow
            ? "rgba(250,204,21,0.06)"
            : "rgba(255,255,255,0.03)",
      }}
    >
      <span className="text-sm">⏱</span>
      <span
        className="font-mono text-lg font-bold tabular-nums"
        style={{
          color: isCritical ? "#ff3b5c" : isLow ? "#eab308" : "#e2e8f0",
          textShadow: isCritical
            ? "0 0 12px rgba(255,59,92,0.5)"
            : isLow
              ? "0 0 12px rgba(250,204,21,0.4)"
              : "none",
          animation: isCritical ? "pulse 1s ease-in-out infinite" : "none",
        }}
      >
        {min}:{sec.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

export function CluePanel({
  phase,
  activeTeam,
  clue,
  timerDeadline,
}: {
  phase: Phase;
  activeTeam: Team;
  clue: Clue | null;
  timerDeadline?: number | null;
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
        <div className="flex items-center gap-3">
          {timerDeadline && phase === "CLUE" && (
            <CountdownTimer deadline={timerDeadline} />
          )}
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Phase
            </div>
            <div className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-slate-300">
              {PHASE_LABEL[phase] ?? phase}
            </div>
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
            Nombre de mots
          </div>
          <div
            className="mt-1 font-mono text-2xl font-bold"
            style={
              clue
                ? { color: neon, textShadow: `0 0 10px ${neon}50` }
                : { color: "#64748b" }
            }
          >
            {clue ? clue.count : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
