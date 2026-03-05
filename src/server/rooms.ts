import type { GameState } from "../engine/types";

export type RoomId = string;

/* ─── Lobby types ──────────────────────────────────────────── */

export type LobbyPlayer = {
  socketId: string;
  name: string;
  teamId: "red" | "blue" | null;
};

export type Lobby = {
  hostSocketId: string;
  players: LobbyPlayer[];
  config: { roundsToWinMatch: number };
  started: boolean;
};

/* ─── Room ─────────────────────────────────────────────────── */

export type Room = {
  id: RoomId;
  state: GameState | null; // null while in lobby
  masterPin: string;
  createdAt: number;
  lobby: Lobby | null;
  /** Maps player name → teamId, populated when game starts from lobby. */
  playerTeams: Map<string, string>;
  /** Player name of the game host (can reset match). */
  hostPlayerName: string | null;
};

// Use globalThis so the Map is shared between App Router and Pages Router
// (Turbopack bundles them separately, giving each its own module scope).
const globalKey = "__codename_rooms__" as const;
const rooms: Map<RoomId, Room> =
  ((globalThis as Record<string, unknown>)[globalKey] as Map<RoomId, Room>) ??
  (() => {
    const m = new Map<RoomId, Room>();
    (globalThis as Record<string, unknown>)[globalKey] = m;
    return m;
  })();

export function getRoom(roomId: string): Room | null {
  return rooms.get(roomId) ?? null;
}

export function upsertRoom(room: Room) {
  rooms.set(room.id, room);
}

export function updateRoomState(roomId: string, state: GameState) {
  const room = rooms.get(roomId);
  if (!room) return;
  rooms.set(roomId, { ...room, state });
}

export function generateRoomId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** Return a lightweight summary of every active room (no secrets). */
export function listRoomSummaries() {
  const out: Array<{
    id: string;
    phase: string;
    roundIndex: number;
    teams: Array<{ id: string; name: string; color: string; roundsWon: number }>;
    createdAt: number;
    lobbyPlayerCount?: number;
  }> = [];

  for (const room of rooms.values()) {
    if (room.lobby && !room.lobby.started) {
      // Room is still in lobby
      out.push({
        id: room.id,
        phase: "LOBBY",
        roundIndex: 0,
        teams: [],
        createdAt: room.createdAt,
        lobbyPlayerCount: room.lobby.players.length,
      });
    } else if (room.state) {
      const s = room.state;
      out.push({
        id: room.id,
        phase: s.phase,
        roundIndex: s.roundIndex,
        teams: Object.values(s.teams).map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          roundsWon: t.roundsWon,
        })),
        createdAt: room.createdAt,
      });
    }
  }

  // newest first
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out;
}

export function sanitizeStateForPublic(state: GameState): GameState {
  // Pre-compute agent counts before hiding card secrets
  const agentCounts: Record<string, { total: number; remaining: number }> = {};
  for (const teamId of Object.keys(state.teams)) {
    const total = state.cards.filter(
      (c) => c.secret.kind === "AGENT" && c.secret.teamId === teamId,
    ).length;
    const remaining = state.cards.filter(
      (c) =>
        c.secret.kind === "AGENT" &&
        c.secret.teamId === teamId &&
        c.revealedByTeamId === null,
    ).length;
    agentCounts[teamId] = { total, remaining };
  }

  return {
    ...state,
    cards: state.cards.map((c) =>
      c.revealedByTeamId ? c : { ...c, secret: { kind: "NEUTRAL" } },
    ),
    teams: Object.fromEntries(
      Object.entries(state.teams).map(([id, t]) => [
        id,
        {
          ...t,
          mission: null,
          agentsTotal: agentCounts[id]?.total ?? 0,
          agentsRemaining: agentCounts[id]?.remaining ?? 0,
          missionCompleted: t.mission?.completed ?? false,
        },
      ]),
    ),
  };
}
