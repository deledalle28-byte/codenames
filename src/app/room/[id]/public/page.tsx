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
      <div className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-xl font-bold">Room introuvable</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Crée une partie depuis l’accueil, puis ouvre cette URL depuis un autre appareil (même Wi‑Fi).
          </p>
          {error ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">Erreur: {error}</p>
          ) : null}
          <Link className="mt-4 inline-block underline" href="/">
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

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Public
            </div>
            <div className="text-xl font-bold">Room {roomId}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900" href="/">
              Accueil
            </Link>
            <button
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
              onClick={() => dispatch({ type: "RESET_MATCH" })}
            >
              Reset match
            </button>
          </div>
        </header>

        {state.matchWinnerTeamId ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm font-semibold">Match terminé</div>
            <div className="mt-1 text-lg font-bold">
              Victoire: {state.teams[state.matchWinnerTeamId].name}
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
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
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50"
                onClick={() => dispatch({ type: "STOP_GUESSING", payload: {} })}
                disabled={state.phase !== "GUESS"}
              >
                Stop
              </button>
              <button
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 disabled:opacity-50"
                onClick={() => dispatch({ type: "END_TURN", payload: {} })}
                disabled={state.phase === "ROUND_OVER" || state.phase === "MATCH_OVER"}
              >
                Fin de tour
              </button>
              <button
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 disabled:opacity-50"
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
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Joueurs connectés ({connectedPlayers.length})
                </div>
                <ul className="mt-2 grid gap-1.5">
                  {connectedPlayers.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          p.role === "master" ? "bg-purple-500" : "bg-blue-500"
                        }`}
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-zinc-400">
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
  );
}

