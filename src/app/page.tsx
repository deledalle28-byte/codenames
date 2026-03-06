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
  red: "bg-red-500 shadow-lg shadow-red-500/50",
  blue: "bg-blue-500 shadow-lg shadow-blue-500/50",
  green: "bg-green-500 shadow-lg shadow-green-500/50",
  yellow: "bg-yellow-400 shadow-lg shadow-yellow-400/50",
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
  const [teamsCount, setTeamsCount] = useState<2 | 3 | 4>(2);
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
      body: JSON.stringify({ roundsToWinMatch: roundsToWin, teamsCount }),
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
    router.push(`/room/${json.roomId}/lobby`);
  }

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 bg-grid-pattern p-4 text-white sm:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* ── Header ──────────────────────────────────────── */}
        <header className="flex flex-col items-center gap-2 pt-6 text-center">
          <h1
            className="bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl"
            style={{ filter: "drop-shadow(0 0 20px rgba(168,85,247,0.3))" }}
          >
            Codename
          </h1>
          <p className="max-w-md text-sm text-slate-500">
            Jeu d&apos;espions en&nbsp;equipe. Cree une partie, partage le lien et jouez ensemble.
          </p>
        </header>

        {/* ── Player name ────────────────────────────────── */}
        <div className="mx-auto w-full max-w-sm">
          <label className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition focus-within:border-purple-500/50 focus-within:shadow-lg focus-within:shadow-purple-500/10">
            <span className="text-lg">🕵️</span>
            <input
              className="flex-1 bg-transparent text-sm font-medium text-white placeholder-slate-600 outline-none"
              placeholder="Ton nom d'agent..."
              value={playerName}
              onChange={(e) => onNameChange(e.target.value)}
              maxLength={20}
            />
            {playerName && (
              <span className="rounded-full border border-green-500/30 bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold text-green-400">
                ✓
              </span>
            )}
          </label>
        </div>

        {/* ── Active rooms ────────────────────────────────── */}
        {rooms.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
              Parties en cours
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => {
                const isLobby = room.phase === "LOBBY";
                return (
                  <div
                    key={room.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.15] hover:bg-white/[0.06] hover:shadow-lg hover:shadow-purple-500/5"
                    style={{ animation: "fade-in 0.3s ease-out" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-bold tracking-widest text-white">
                        {room.id}
                      </span>
                      <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
                        {PHASE_LABEL[room.phase] ?? room.phase}
                      </span>
                    </div>

                    {isLobby ? (
                      <div className="mt-2 text-sm text-slate-500">
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
                            <span className="font-medium text-slate-300">{t.name}</span>
                            <span className="text-xs text-slate-600">{t.roundsWon}W</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-1 text-[11px] text-slate-600">
                      {isLobby ? "" : `Manche ${room.roundIndex + 1} \u00b7 `}
                      {timeAgo(room.createdAt)}
                    </div>

                    <div className="mt-3">
                      {isLobby ? (
                        <Link
                          href={`/room/${room.id}/lobby`}
                          className="block rounded-lg bg-purple-600/30 border border-purple-500/30 py-1.5 text-center text-xs font-semibold text-purple-300 transition hover:bg-purple-500/40 hover:text-white"
                        >
                          Rejoindre le lobby
                        </Link>
                      ) : (
                        <div className="flex gap-2">
                          <Link
                            href={`/room/${room.id}/public`}
                            className="flex-1 rounded-lg bg-blue-600/30 border border-blue-500/30 py-1.5 text-center text-xs font-semibold text-blue-300 transition hover:bg-blue-500/40 hover:text-white"
                          >
                            Rejoindre
                          </Link>
                          <Link
                            href={`/room/${room.id}/master`}
                            className="flex-1 rounded-lg bg-white/[0.06] border border-white/[0.08] py-1.5 text-center text-xs font-semibold text-slate-400 transition hover:bg-white/[0.1] hover:text-white"
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
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-xs font-black shadow-lg shadow-red-500/20">
                +
              </span>
              Nouvelle partie
            </h2>

            <div className="mt-5 grid gap-4">
              {/* ── Mode selector ── */}
              <div className="grid gap-1 text-xs">
                <span className="font-semibold text-slate-500">Mode de jeu</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTeamsCount(2)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                      teamsCount === 2
                        ? "border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-lg shadow-purple-500/10"
                        : "border-white/[0.1] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span>vs</span>
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">2v2 &middot; 6&times;6</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamsCount(3)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                      teamsCount === 3
                        ? "border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-lg shadow-purple-500/10"
                        : "border-white/[0.1] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">2v2v2 &middot; 7&times;7</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamsCount(4)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                      teamsCount === 4
                        ? "border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-lg shadow-purple-500/10"
                        : "border-white/[0.1] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">2v2v2v2 &middot; 8&times;8</div>
                  </button>
                </div>
              </div>

              <label className="grid gap-1 text-xs">
                <span className="font-semibold text-slate-500">Longueur de la partie (manches)</span>
                <input
                  className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white transition focus:border-purple-500/50 focus:outline-none"
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
                className="mt-1 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {creating ? "Chargement..." : "Creer la partie"}
              </button>

              {createError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {createError}
                </div>
              )}
            </div>
          </section>

          {/* ── Join ───────────────────────────────────── */}
          <section className="flex flex-col gap-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-[13px] font-black shadow-lg shadow-blue-500/20">
                  &rarr;
                </span>
                Rejoindre
              </h2>
              <div className="mt-4 grid gap-3">
                <input
                  className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-center font-mono text-lg font-bold uppercase tracking-[0.3em] text-white placeholder-slate-600 transition focus:border-blue-500/50 focus:outline-none focus:shadow-lg focus:shadow-blue-500/10"
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
                      ? "bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:bg-purple-500/40 hover:text-white"
                      : "cursor-not-allowed bg-white/[0.04] text-slate-600"
                  }`}
                >
                  Rejoindre le lobby
                </Link>
              </div>
            </div>

            {/* ── How-to ──────────────────────────────── */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
              <h2 className="text-sm font-bold text-slate-400">Comment jouer ?</h2>
              <ol className="mt-3 grid gap-2 text-sm text-slate-500">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/15 text-[11px] font-bold text-red-400">
                    1
                  </span>
                  Cree une partie et partage le <b className="text-slate-300">code</b> a tes amis.
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/15 text-[11px] font-bold text-blue-400">
                    2
                  </span>
                  Dans le <b className="text-slate-300">lobby</b>, chacun choisit son equipe.
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/15 text-[11px] font-bold text-purple-400">
                    3
                  </span>
                  Le chef lance la partie, les roles sont attribues au hasard !
                </li>
              </ol>
            </div>
          </section>
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="pb-6 text-center text-[11px] text-slate-700">
          Codename &middot; Multijoueur
        </footer>
      </div>
    </div>
  );
}
