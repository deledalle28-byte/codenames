"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Board } from "@/components/Board";
import { CluePanel } from "@/components/CluePanel";
import { Scoreboard } from "@/components/Scoreboard";
import type { Card, TeamColor } from "@/engine/types";
import { getCardsForPublic } from "@/engine/selectors";
import { useRoomOnlineGame } from "@/app/lib/useRoomOnlineGame";
import { RulesBook } from "@/components/RulesBook";

const NEON: Record<string, string> = {
  red: "#ff3b5c",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
};

export default function PublicRoomPage() {
  const params = useParams<{ id: string }>();
  const roomId = params?.id;
  if (!roomId) return null;
  return <PublicRoomInner roomId={roomId} />;
}

function PublicRoomInner({ roomId }: { roomId: string }) {
  const [playerName, setPlayerName] = useState("");
  useEffect(() => {
    setPlayerName(localStorage.getItem("codename_playerName") ?? "");
  }, []);
  const { state, dispatch, error, connectedPlayers } = useRoomOnlineGame({ roomId, role: "public", playerName });

  const teamColorById = useMemo(() => {
    const map: Record<string, TeamColor> = {};
    if (!state) return map;
    for (const t of Object.values(state.teams)) map[t.id] = t.color;
    return map;
  }, [state]);

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 bg-grid-pattern p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
          <h1 className="text-xl font-bold">Room introuvable</h1>
          <p className="mt-2 text-sm text-slate-500">
            Cree une partie depuis l'accueil, puis ouvre cette URL depuis un autre appareil.
          </p>
          {error ? (
            <p className="mt-2 text-sm text-red-400">Erreur: {error}</p>
          ) : null}
          <Link className="mt-4 inline-block text-purple-400 underline transition hover:text-purple-300" href="/">
            Retour
          </Link>
        </div>
      </div>
    );
  }

  const publicCards = getCardsForPublic(state);
  const canClick = state.phase === "GUESS" && Boolean(state.clue);

  function onCardClick(card: Card) {
    if (!canClick) return;
    dispatch({ type: "REVEAL_CARD", payload: { cardId: card.id } });
  }

  const activeTeam = state.teams[state.activeTeamId];
  const winnerNeon = state.matchWinnerTeamId
    ? NEON[state.teams[state.matchWinnerTeamId]?.color] ?? "#f1f5f9"
    : null;

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 bg-grid-pattern p-4 text-white sm:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Public
            </div>
            <div className="text-xl font-bold">Room {roomId}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              href="/"
            >
              Accueil
            </Link>
            <button
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              onClick={() => dispatch({ type: "RESET_MATCH" })}
            >
              Reset match
            </button>
          </div>
        </header>

        {state.matchWinnerTeamId ? (
          <div
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm"
            style={{ animation: "slide-up 0.3s ease-out" }}
          >
            <div className="text-sm font-semibold text-slate-400">Match terminé</div>
            <div
              className="mt-1 text-lg font-bold"
              style={winnerNeon ? { color: winnerNeon, textShadow: `0 0 15px ${winnerNeon}50` } : undefined}
            >
              Victoire: {state.teams[state.matchWinnerTeamId].name}
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <Board
              cards={publicCards}
              gridSize={state.gridSize}
              secretForDisplay={(c) => c.publicSecret}
              onCardClick={onCardClick}
              disabled={!canClick}
              teamColorById={teamColorById}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-white/[0.1] bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-40"
                onClick={() => dispatch({ type: "STOP_GUESSING", payload: {} })}
                disabled={state.phase !== "GUESS"}
              >
                Stop
              </button>
              <button
                className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                onClick={() => dispatch({ type: "END_TURN", payload: {} })}
                disabled={state.phase === "ROUND_OVER" || state.phase === "MATCH_OVER"}
              >
                Fin de tour
              </button>
              <button
                className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                onClick={() => dispatch({ type: "NEXT_ROUND" })}
                disabled={state.phase !== "ROUND_OVER"}
              >
                Nouvelle manche
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            <CluePanel phase={state.phase} activeTeam={activeTeam} clue={state.clue} />
            <Scoreboard state={state} />

            {/* ── Connected players ── */}
            {connectedPlayers.length > 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Joueurs connectés ({connectedPlayers.length})
                </div>
                <ul className="mt-2 grid gap-1.5">
                  {connectedPlayers.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          p.role === "master"
                            ? "bg-purple-500 shadow-lg shadow-purple-500/50"
                            : "bg-blue-500 shadow-lg shadow-blue-500/50"
                        }`}
                      />
                      <span className="font-medium text-slate-200">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {p.role === "master" ? "Master" : "Joueur"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    <RulesBook />
    </>
  );
}
