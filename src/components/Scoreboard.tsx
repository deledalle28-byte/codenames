"use client";

import type { GameState, Team } from "@/engine/types";
import { getTeamAgentsRemaining } from "@/engine/selectors";

function badgeColor(team: Team) {
  if (team.color === "red") return "bg-red-600 text-white";
  if (team.color === "blue") return "bg-blue-600 text-white";
  if (team.color === "green") return "bg-green-600 text-white";
  if (team.color === "yellow") return "bg-yellow-400 text-black";
  return "bg-zinc-600 text-white";
}

export function Scoreboard({ state }: { state: GameState }) {
  const teams = state.turnOrderTeamIds.map((id) => state.teams[id]).filter(Boolean);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-sm font-semibold">Score</div>
      <div className="mt-3 grid gap-2">
        {teams.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${badgeColor(t)}`}>
                {t.name}
              </span>
              <span className="text-xs text-zinc-500">
                Agents restants: {getTeamAgentsRemaining(state, t.id)}
              </span>
            </div>
            <div className="text-sm font-bold">Manches: {t.roundsWon}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

