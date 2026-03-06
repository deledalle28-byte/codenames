"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Board } from "@/components/Board";
import { CluePanel } from "@/components/CluePanel";
import { MissionPanel } from "@/components/MissionPanel";
import { Scoreboard } from "@/components/Scoreboard";
import type { TeamColor } from "@/engine/types";
import { useRoomOnlineGame } from "@/app/lib/useRoomOnlineGame";
import { validateClue } from "@/engine/rules/clueValidator";
import { RulesBook } from "@/components/RulesBook";

function readPlayerName(): string {
  return localStorage.getItem("codename_playerName") ?? "";
}

function readPinFromHash(): string {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return (params.get("pin") ?? "").trim();
}

function randomSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
}

export default function MasterRoomPage() {
  const params = useParams<{ id: string }>();
  const roomId = params?.id;
  if (!roomId) return null;
  return <MasterRoomInner roomId={roomId} />;
}

function MasterRoomInner({ roomId }: { roomId: string }) {
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [pin, setPin] = useState("");
  const [pinOk, setPinOk] = useState(false);

  useEffect(() => {
    setPlayerName(readPlayerName());
    const hashPin = readPinFromHash();
    if (hashPin) {
      setPin(hashPin);
      setPinOk(true);
    }
  }, []);

  const { state, dispatch, error, serverIsMaster, isHost, myTeamId, connectedPlayers, roleChange } = useRoomOnlineGame({
    roomId,
    role: "master",
    pin: pinOk ? pin : undefined,
    playerName,
  });

  // Redirect when demoted to guesser (role rotation between rounds)
  useEffect(() => {
    if (roleChange?.role === "guesser") {
      router.push(`/room/${roomId}/public`);
    }
  }, [roleChange, roomId, router]);

  const teamColorById = useMemo(() => {
    const map: Record<string, TeamColor> = {};
    if (!state) return map;
    for (const t of Object.values(state.teams)) map[t.id] = t.color;
    return map;
  }, [state]);

  const [clueText, setClueText] = useState("");
  const [clueCount, setClueCount] = useState(1);
  const [clueError, setClueError] = useState<string | null>(null);

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 bg-grid-pattern p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
          <h1 className="text-xl font-bold">Room introuvable</h1>
          <p className="mt-2 text-sm text-slate-500">
            Cree une partie depuis l'accueil, puis ouvre cette URL.
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

  if (!pinOk) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 bg-grid-pattern p-6 text-white">
        <div className="mx-auto max-w-md rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-6 backdrop-blur-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-purple-400">
            👑 Spymaster
          </div>
          <h1 className="mt-1 text-xl font-bold">PIN requis</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ajoute `#pin=...` à l'URL ou saisis-le ci-dessous.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-white transition focus:border-purple-500/50 focus:outline-none"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
            />
            <button
              className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110"
              onClick={() => setPinOk(Boolean(pin.trim()))}
            >
              OK
            </button>
          </div>
          <Link className="mt-4 inline-block text-purple-400 underline transition hover:text-purple-300" href={`/room/${roomId}/public`}>
            Aller en Public
          </Link>
        </div>
      </div>
    );
  }

  const NEON: Record<string, string> = {
    red: "#ff3b5c",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
  };

  const s = state;
  const activeTeam = s.teams[s.activeTeamId];
  const isMyTurn = myTeamId === s.activeTeamId;
  const myTeam = myTeamId ? s.teams[myTeamId] : null;
  const canGiveClue = s.phase === "CLUE" && isMyTurn;

  function giveClue() {
    if (serverIsMaster === false) {
      setClueError("PIN invalide (serveur).");
      return;
    }
    if (!isMyTurn) {
      setClueError("Ce n'est pas le tour de ton équipe.");
      return;
    }
    const text = clueText.trim();
    const count = Number(clueCount);
    const validation = validateClue({
      clueText: text,
      cards: s.cards,
      config: {
        forbiddenClueMode: s.config.forbiddenClueMode,
        forbiddenClueExtraWords: s.config.forbiddenClueExtraWords,
      },
    });
    if (!validation.ok) {
      setClueError(validation.reason);
      return;
    }
    setClueError(null);
    dispatch({ type: "GIVE_CLUE", payload: { text, count } });
    setClueText("");
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 bg-grid-pattern p-4 text-white sm:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest text-purple-400"
              style={{ textShadow: "0 0 10px rgba(168,85,247,0.3)" }}
            >
              👑 Spymaster &middot; Room {roomId}
            </div>
            {myTeam ? (
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full shadow-lg"
                  style={{
                    backgroundColor: NEON[myTeam.color] ?? "#94a3b8",
                    boxShadow: `0 0 10px ${NEON[myTeam.color] ?? "#94a3b8"}60`,
                  }}
                />
                <span
                  className="text-xl font-bold"
                  style={{
                    color: NEON[myTeam.color] ?? "#f1f5f9",
                    textShadow: `0 0 12px ${NEON[myTeam.color] ?? "#f1f5f9"}40`,
                  }}
                >
                  Équipe {myTeam.name}
                </span>
              </div>
            ) : (
              <div className="text-xl font-bold">Spymaster</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              href={`/room/${roomId}/public`}
              target="_blank"
            >
              Ouvrir Public
            </Link>
            <button
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              onClick={() => dispatch({ type: "START_ROUND", payload: { seed: randomSeed() } })}
            >
              Shuffle / new seed
            </button>
            {isHost && (
              <button
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                onClick={() => dispatch({ type: "RESET_MATCH" })}
              >
                Reset match
              </button>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <Board
              cards={state.cards}
              gridSize={state.gridSize}
              secretForDisplay={(c) => c.secret}
              disabled={true}
              teamColorById={teamColorById}
            />

            <div className={`mt-4 rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 ${
              canGiveClue
                ? "border-purple-500/20 bg-purple-500/[0.04]"
                : "border-white/[0.06] bg-white/[0.02] opacity-60"
            }`}>
              <div className="text-sm font-semibold text-purple-300">
                {canGiveClue
                  ? "Donner un indice"
                  : !isMyTurn
                    ? `En attente — tour de l'équipe ${activeTeam.name}`
                    : "Donner un indice"}
              </div>
              <div className="mt-3 grid grid-cols-[1fr_120px] gap-2">
                <input
                  className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-white placeholder-slate-600 transition focus:border-purple-500/50 focus:outline-none disabled:opacity-40"
                  value={clueText}
                  onChange={(e) => setClueText(e.target.value)}
                  placeholder="Texte"
                  disabled={!canGiveClue}
                />
                <input
                  className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-white transition focus:border-purple-500/50 focus:outline-none disabled:opacity-40"
                  type="number"
                  min={0}
                  value={clueCount}
                  onChange={(e) => setClueCount(Number(e.target.value))}
                  disabled={!canGiveClue}
                />
              </div>
              {clueError ? (
                <div className="mt-2 text-sm text-red-400">{clueError}</div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 disabled:opacity-40"
                  onClick={giveClue}
                  disabled={!canGiveClue}
                >
                  Valider (équipe {activeTeam.name})
                </button>
                <button
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                  onClick={() => dispatch({ type: "NEXT_ROUND" })}
                  disabled={state.phase !== "ROUND_OVER"}
                >
                  Nouvelle manche
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-600">
                {canGiveClue
                  ? "Rappel: l'indice est refusé si substring d'un mot du board (accents/casse ignorés)."
                  : "Tu pourras donner un indice quand ce sera le tour de ton équipe."}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <CluePanel phase={state.phase} activeTeam={activeTeam} clue={state.clue} />
            <Scoreboard state={state} />
            <MissionPanel teams={Object.values(state.teams)} />

            {/* ── Connected players ── */}
            {connectedPlayers.length > 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Joueurs connectés ({connectedPlayers.length})
                </div>
                <ul className="mt-2 grid gap-1.5">
                  {connectedPlayers.map((p) => {
                    const teamColor = p.teamId && state.teams[p.teamId]
                      ? NEON[state.teams[p.teamId].color] ?? "#94a3b8"
                      : "#94a3b8";
                    const teamName = p.teamId && state.teams[p.teamId]
                      ? state.teams[p.teamId].name
                      : null;
                    return (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shadow-lg"
                          style={{
                            backgroundColor: teamColor,
                            boxShadow: `0 0 8px ${teamColor}50`,
                          }}
                        />
                        <span className="font-medium text-slate-200">
                          {p.name}
                        </span>
                        {teamName && (
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: teamColor }}
                          >
                            {teamName}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-600">
                          {p.role === "master" ? "Master" : "Joueur"}
                        </span>
                      </li>
                    );
                  })}
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
