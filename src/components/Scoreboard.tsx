"use client";

import type { GameState, Team, TeamColor } from "@/engine/types";
import { getTeamAgentsRemaining } from "@/engine/selectors";

const BADGE: Record<TeamColor, string> = {
  red: "bg-red-500/20 text-red-400 border border-red-500/30",
  blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  green: "bg-green-500/20 text-green-400 border border-green-500/30",
  yellow: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

const BAR_COLOR: Record<TeamColor, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
};

function getTeamStats(state: GameState, t: Team) {
  // Use pre-computed counts from sanitized state when available,
  // fall back to computing from card secrets (master view).
  const total =
    t.agentsTotal ??
    state.cards.filter(
      (c) => c.secret.kind === "AGENT" && c.secret.teamId === t.id,
    ).length;
  const remaining =
    t.agentsRemaining ?? getTeamAgentsRemaining(state, t.id);
  const found = total - remaining;
  const missionDone = t.missionCompleted ?? t.mission?.completed ?? false;
  const penalty = t.assassinPenalty ?? 0;
  const points = found + (missionDone ? 3 : 0) - penalty;
  return { total, remaining, found, points, penalty };
}

export function Scoreboard({ state }: { state: GameState }) {
  const teams = state.turnOrderTeamIds.map((id) => state.teams[id]).filter(Boolean);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Score</div>
      <div className="mt-3 grid gap-3">
        {teams.map((t) => {
          const { total, remaining, points } = getTeamStats(state, t);
          const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;

          return (
            <div
              key={t.id}
              className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${BADGE[t.color] ?? BADGE.red}`}
                  >
                    {t.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {remaining} mot{remaining > 1 ? "s" : ""} restant{remaining > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-white">
                  {points} <span className="text-xs text-slate-500">pt{points > 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${BAR_COLOR[t.color] ?? BAR_COLOR.red}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
