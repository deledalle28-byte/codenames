"use client";

import type { Team } from "@/engine/types";

export function MissionPanel({ teams, title }: { teams: Team[]; title?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-sm font-semibold">{title ?? "Missions"}</div>
      <div className="mt-3 grid gap-2">
        {teams.map((t) => (
          <div
            key={t.id}
            className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-zinc-500">
                {t.mission?.completed ? "Complétée" : "En cours"}
              </div>
            </div>
            <div className="mt-1 text-zinc-700 dark:text-zinc-200">{t.mission?.title ?? "—"}</div>
            {t.mission?.kind === "PROGRESSIVE" ? (
              <div className="mt-1 text-xs text-zinc-500">
                {t.mission.progressCount}/{t.mission.targetCount}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

