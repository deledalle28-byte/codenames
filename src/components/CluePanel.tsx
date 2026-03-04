"use client";

import type { Clue, Phase, Team } from "@/engine/types";

export function CluePanel({
  phase,
  activeTeam,
  clue,
}: {
  phase: Phase;
  activeTeam: Team;
  clue: Clue | null;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Équipe active
          </div>
          <div className="text-lg font-bold">{activeTeam.name}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Phase
          </div>
          <div className="font-mono text-sm">{phase}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Indice
          </div>
          <div className="mt-1 text-base font-semibold">
            {clue ? clue.text : <span className="text-zinc-500">—</span>}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Essais restants
          </div>
          <div className="mt-1 text-base font-semibold">
            {clue ? clue.guessesRemaining : <span className="text-zinc-500">—</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

