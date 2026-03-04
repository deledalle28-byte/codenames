"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* ─── localStorage helpers ─────────────────────────────────── */
function readName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("codename_playerName") ?? "";
}
function saveName(name: string) {
  localStorage.setItem("codename_playerName", name);
}

/* ─── Types ─────────────────────────────────────────────────── */
type RoomSummary = {
  id: string;
  phase: string;
  roundIndex: number;
  teams: Array<{ id: string; name: string; color: string; roundsWon: number }>;
  createdAt: number;
  lobbyPlayerCount?: number;
};

/* ─── Helpers ───────────────────────────────────────────────── */
const PHASE_LABEL: Record<string, string> = {
  LOBBY: "Salle d'attente",
  CLUE: "Indice",
  GUESS: "Devinette",
  ROUND_OVER: "Fin de manche",
  MATCH_OVER: "Termine",
};

function timeAgo(ts: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 60) return "a l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  return `il y a ${Math.floor(diff / 3600)}h`;
}

const TEAM_DOT: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
};

/* ─── Component ─────────────────────────────────────────────── */
export default function Home() {
  const router = useRouter();

  /* ---- player name (persisted) ---- */
  const [playerName, setPlayerName] = useState("");
  useEffect(() => {
    setPlayerName(readName());
  }, []);
  function onNameChange(v: string) {
    setPlayerName(v);
    saveName(v);
  }

  /* ---- create form state ---- */
  const [roundsToWin, setRoundsToWin] = useState(3);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /* ---- join state ---- */
  const [joinRoomId, setJoinRoomId] = useState("");
  const joinId = useMemo(() => joinRoomId.trim().toUpperCase(), [joinRoomId]);

  /* ---- active rooms ---- */
  const [rooms, setRooms] = useState<RoomSummary[]>([]);

  const fetchRooms = useCallback(async () => {
    const r = await fetch("/api/room/list").catch(() => null);
    if (!r?.ok) return;
    const json = (await r.json().catch(() => null)) as { rooms?: RoomSummary[] } | null;
    if (json?.rooms) setRooms(json.rooms);
  }, []);

  useEffect(() => {
    fetchRooms();
    const id = setInterval(fetchRooms, 5000);
    return () => clearInterval(id);
  }, [fetchRooms]);

  /* ---- actions ---- */
  async function createMatch() {
    setCreateError(null);
    setCreating(true);
    const resp = await fetch("/api/room/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundsToWinMatch: roundsToWin }),
    }).catch(() => null);

    setCreating(false);

    if (!resp || !resp.ok) {
      setCreateError("Impossible de creer la room.");
      return;
    }
    const json = (await resp.json().catch(() => null)) as null | { roomId?: string };
    if (!json?.roomId) {
      setCreateError("Reponse serveur invalide.");
      return;
    }
    // Redirect straight to the lobby
    router.push(`/room/${json.roomId}/lobby`);
  }

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white sm:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* ── Header ──────────────────────────────────────── */}
        <header className="flex flex-col items-center gap-2 pt-6 text-center">
          <h1 className="bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Codename
          </h1>
          <p className="max-w-md text-sm text-slate-400">
            Jeu d&apos;espions en&nbsp;equipe. Cree une partie, partage le lien et jouez sur le meme Wi-Fi.
          </p>
        </header>

        {/* ── Player name ────────────────────────────────── */}
        <div className="mx-auto w-full max-w-sm">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur transition focus-within:border-purple-500/50">
            <span className="text-lg">&#128373;&#65039;</span>
            <input
              className="flex-1 bg-transparent text-sm font-medium text-white placeholder-slate-500 outline-none"
              placeholder="Ton nom d'agent..."
              value={playerName}
              onChange={(e) => onNameChange(e.target.value)}
              maxLength={20}
            />
            {playerName && (
              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold text-green-400">
                &#10003;
              </span>
            )}
          </label>
        </div>

        {/* ── Active rooms ────────────────────────────────── */}
        {rooms.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
              Parties en cours
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => {
                const isLobby = room.phase === "LOBBY";
                return (
                  <div
                    key={room.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-bold tracking-widest text-white">
                        {room.id}
                      </span>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                        {PHASE_LABEL[room.phase] ?? room.phase}
                      </span>
                    </div>

                    {isLobby ? (
                      <div className="mt-2 text-sm text-slate-400">
                        {room.lobbyPlayerCount ?? 0} joueur
                        {(room.lobbyPlayerCount ?? 0) > 1 ? "s" : ""} en attente
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-3">
                        {room.teams.map((t) => (
                          <div key={t.id} className="flex items-center gap-1.5 text-sm">
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full ${TEAM_DOT[t.color] ?? "bg-slate-500"}`}
                            />
                            <span className="font-medium text-slate-200">{t.name}</span>
                            <span className="text-xs text-slate-500">{t.roundsWon}W</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-1 text-[11px] text-slate-500">
                      {isLobby ? "" : `Manche ${room.roundIndex + 1} \u00b7 `}
                      {timeAgo(room.createdAt)}
                    </div>

                    <div className="mt-3">
                      {isLobby ? (
                        <Link
                          href={`/room/${room.id}/lobby`}
                          className="block rounded-lg bg-purple-600/80 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-purple-500"
                        >
                          Rejoindre le lobby
                        </Link>
                      ) : (
                        <div className="flex gap-2">
                          <Link
                            href={`/room/${room.id}/public`}
                            className="flex-1 rounded-lg bg-blue-600/80 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-blue-500"
                          >
                            Rejoindre
                          </Link>
                          <Link
                            href={`/room/${room.id}/master`}
                            className="flex-1 rounded-lg bg-white/10 py-1.5 text-center text-xs font-semibold text-slate-300 transition hover:bg-white/20"
                          >
                            Master
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Main grid ───────────────────────────────────── */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* ── Create ─────────────────────────────────── */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-xs font-black">
                +
              </span>
              Nouvelle partie
            </h2>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-xs">
                <span className="font-semibold text-slate-400">Manches pour gagner</span>
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                  type="number"
                  min={1}
                  value={roundsToWin}
                  onChange={(e) => setRoundsToWin(Number(e.target.value))}
                />
              </label>

              <button
                type="button"
                onClick={createMatch}
                disabled={creating}
                className="mt-1 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {creating ? "Chargement..." : "Creer la partie"}
              </button>

              {createError && (
                <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {createError}
                </div>
              )}
            </div>
          </section>

          {/* ── Join ───────────────────────────────────── */}
          <section className="flex flex-col gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-[13px] font-black">
                  &rarr;
                </span>
                Rejoindre
              </h2>
              <div className="mt-4 grid gap-3">
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-lg font-bold uppercase tracking-[0.3em] text-white placeholder-slate-600 transition focus:border-blue-500/50 focus:outline-none"
                  placeholder="CODE"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  maxLength={6}
                />
                <Link
                  href={joinId ? `/room/${joinId}/lobby` : "#"}
                  aria-disabled={!joinId}
                  className={`rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                    joinId
                      ? "bg-purple-600/80 text-white hover:bg-purple-500"
                      : "cursor-not-allowed bg-white/5 text-slate-600"
                  }`}
                >
                  Rejoindre le lobby
                </Link>
              </div>
            </div>

            {/* ── How-to ──────────────────────────────── */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-sm font-bold text-slate-300">Comment jouer ?</h2>
              <ol className="mt-3 grid gap-2 text-sm text-slate-400">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[11px] font-bold text-red-400">
                    1
                  </span>
                  Cree une partie et partage le <b className="text-slate-300">code</b> a tes amis.
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[11px] font-bold text-blue-400">
                    2
                  </span>
                  Dans le <b className="text-slate-300">lobby</b>, chacun choisit son equipe.
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[11px] font-bold text-purple-400">
                    3
                  </span>
                  Le chef lance la partie, les roles sont attribues au hasard !
                </li>
              </ol>
            </div>
          </section>
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="pb-6 text-center text-[11px] text-slate-600">
          Codename &middot; MVP &middot; Multijoueur LAN
        </footer>
      </div>
    </div>
  );
}
