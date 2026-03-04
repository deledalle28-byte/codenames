"use client";

import type { Team } from "@/engine/types";

export function MissionPanel({ teams, title }: { teams: Team[]; title?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
        <span className="text-sm">🔒</span>
        {title ?? "Missions Secrètes"}
      </div>
      <div className="mt-3 grid gap-2">
        {teams.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-200">{t.name}</div>
              {t.mission?.completed ? (
                <span
                  className="rounded border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400"
                  style={{ transform: "rotate(-3deg)", display: "inline-block" }}
                >
                  Complétée
                </span>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-500/70 animate-pulse">
                  En cours
                </span>
              )}
            </div>
            <div className="mt-1 text-slate-400">{t.mission?.title ?? "—"}</div>

            {/* Progressive mission: progress bar */}
            {t.mission?.kind === "PROGRESSIVE" ? (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>
                    {t.mission.progressCount}/{t.mission.targetCount}
                  </span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, (t.mission.progressCount / (t.mission.targetCount ?? 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
