"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLobby } from "@/app/lib/useLobby";

export default function LobbyPage() {
  const params = useParams<{ id: string }>();
  const roomId = params?.id;
  if (!roomId) return null;
  return <LobbyInner roomId={roomId} />;
}

function LobbyInner({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  useEffect(() => {
    setPlayerName(localStorage.getItem("codename_playerName") ?? "");
  }, []);
  const { lobby, gameStarted, isHost, socketId, error, chooseTeam, start } = useLobby({
    roomId,
    playerName,
  });

  // Redirect when game starts
  useEffect(() => {
    if (!gameStarted) return;
    if (gameStarted.role === "spymaster" && gameStarted.masterPin) {
      router.push(`/room/${roomId}/master#pin=${encodeURIComponent(gameStarted.masterPin)}`);
    } else {
      router.push(`/room/${roomId}/public`);
    }
  }, [gameStarted, roomId, router]);

  // If game already started (late joiner), go to public
  useEffect(() => {
    if (error === "GAME_ALREADY_STARTED") {
      router.push(`/room/${roomId}/public`);
    }
  }, [error, roomId, router]);

  const redPlayers = lobby?.players.filter((p) => p.teamId === "red") ?? [];
  const bluePlayers = lobby?.players.filter((p) => p.teamId === "blue") ?? [];
  const unassigned = lobby?.players.filter((p) => p.teamId === null) ?? [];
  const myTeam = lobby?.players.find((p) => p.socketId === socketId)?.teamId ?? null;
  const canStart = redPlayers.length >= 2 && bluePlayers.length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white sm:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        {/* ── Header ─────────────────────────────────────── */}
        <header className="flex flex-col items-center gap-3 pt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 transition hover:text-slate-300"
          >
            &larr; Accueil
          </Link>
          <h1 className="bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            Salle d&apos;attente
          </h1>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold tracking-[0.3em] text-white">
              {roomId}
            </span>
            <button
              onClick={() => {
                try {
                  navigator.clipboard.writeText(
                    `${location.origin}/room/${roomId}/lobby`,
                  );
                } catch {
                  /* */
                }
              }}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/20"
            >
              Copier le lien
            </button>
          </div>
          <p className="text-sm text-slate-400">
            Partage ce code pour que tes amis rejoignent
          </p>
        </header>

        {/* ── Error ──────────────────────────────────────── */}
        {error && error !== "GAME_ALREADY_STARTED" && (
          <div className="mx-auto rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error === "TEAMS_NOT_READY"
              ? "Chaque équipe doit avoir au moins 2 joueurs."
              : error}
          </div>
        )}

        {/* ── Loading ────────────────────────────────────── */}
        {!lobby && !error && (
          <div className="flex flex-col items-center gap-3 text-slate-400 animate-pulse">
            <div>Connexion au serveur...</div>
            <div className="text-xs text-slate-600">
              Si ca ne charge pas, verifie que le serveur tourne (npm run dev)
            </div>
          </div>
        )}

        {/* ── Connection failed ─────────────────────────── */}
        {error === "CONNECTION_FAILED" && (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              Impossible de se connecter au serveur.
            </div>
            <button
              onClick={() => location.reload()}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/20 transition"
            >
              Reessayer
            </button>
          </div>
        )}

        {/* ── Teams ──────────────────────────────────────── */}
        {lobby && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Red team */}
              <button
                type="button"
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  myTeam === "red"
                    ? "border-red-500 bg-red-500/10"
                    : "border-white/10 bg-white/5 hover:border-red-500/50"
                }`}
                onClick={() => chooseTeam(myTeam === "red" ? null : "red")}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="inline-block h-4 w-4 rounded-full bg-red-500" />
                  <span className="text-lg font-bold text-red-400">
                    Rouge
                  </span>
                  <span className="ml-auto text-sm text-slate-500">
                    {redPlayers.length} joueur
                    {redPlayers.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid min-h-[80px] gap-2">
                  {redPlayers.length === 0 && (
                    <p className="text-sm italic text-slate-600">
                      Clique pour rejoindre...
                    </p>
                  )}
                  {redPlayers.map((p) => (
                    <PlayerChip
                      key={p.socketId}
                      name={p.name}
                      isHost={p.socketId === lobby.hostSocketId}
                      isMe={p.socketId === socketId}
                    />
                  ))}
                </div>
              </button>

              {/* Blue team */}
              <button
                type="button"
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  myTeam === "blue"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:border-blue-500/50"
                }`}
                onClick={() => chooseTeam(myTeam === "blue" ? null : "blue")}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="inline-block h-4 w-4 rounded-full bg-blue-500" />
                  <span className="text-lg font-bold text-blue-400">
                    Bleu
                  </span>
                  <span className="ml-auto text-sm text-slate-500">
                    {bluePlayers.length} joueur
                    {bluePlayers.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid min-h-[80px] gap-2">
                  {bluePlayers.length === 0 && (
                    <p className="text-sm italic text-slate-600">
                      Clique pour rejoindre...
                    </p>
                  )}
                  {bluePlayers.map((p) => (
                    <PlayerChip
                      key={p.socketId}
                      name={p.name}
                      isHost={p.socketId === lobby.hostSocketId}
                      isMe={p.socketId === socketId}
                    />
                  ))}
                </div>
              </button>
            </div>

            {/* Unassigned players */}
            {unassigned.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-400">
                  Sans equipe ({unassigned.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {unassigned.map((p) => (
                    <PlayerChip
                      key={p.socketId}
                      name={p.name}
                      isHost={p.socketId === lobby.hostSocketId}
                      isMe={p.socketId === socketId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <p className="text-center text-xs text-slate-500">
              Le maitre des espions sera choisi au hasard dans chaque equipe.
            </p>

            {/* Start button (host) */}
            {isHost ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={start}
                  disabled={!canStart}
                  className="rounded-2xl bg-gradient-to-r from-red-600 to-blue-600 px-10 py-4 text-lg font-bold shadow-lg shadow-purple-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Lancer la partie !
                </button>
                {!canStart && (
                  <p className="text-sm text-slate-500">
                    Chaque équipe doit avoir au moins 2 joueurs
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-slate-500">
                En attente du lancement par le chef de partie...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Player chip ──────────────────────────────────────────── */

function PlayerChip(props: { name: string; isHost: boolean; isMe: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
      <span className="text-sm font-medium">{props.name}</span>
      {props.isHost && (
        <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
          HOST
        </span>
      )}
      {props.isMe && (
        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">
          TOI
        </span>
      )}
    </div>
  );
}
