import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";
import type { Server as HttpServer } from "http";
import type { Socket as NetSocket } from "net";
import { Server as IOServer } from "socket.io";
import type { Action, TeamId } from "@/engine/types";
import { reduce } from "@/engine/reducer";
import { getRoom, sanitizeStateForPublic, updateRoomState } from "@/server/rooms";
import type { Room, LobbyTeamId } from "@/server/rooms";

export const config = {
  api: { bodyParser: false },
};

type NextResWithSocket = NextApiResponse & {
  socket: NetSocket & { server: HttpServer & { io?: IOServer } };
};

type JoinPayload = {
  roomId: string;
  role: "public" | "master";
  pin?: string;
  playerName?: string;
};
type JoinAck = { ok: boolean; isMaster?: boolean; isHost?: boolean; teamId?: string | null; error?: string };

// Keep a module-level reference so Socket.io event handlers can access the
// server even after the original HTTP response has been closed.
let ioRef: IOServer | null = null;

/* ─── Helpers ──────────────────────────────────────────────── */

function canCallAction(args: { isMaster: boolean; action: Action }) {
  if (args.isMaster) return true;
  if (args.action.type === "GIVE_CLUE") return false;
  if (args.action.type === "START_ROUND") return false;
  if (args.action.type === "NEXT_ROUND") return true; // any player can start next round
  if (args.action.type === "RESET_MATCH") return false;
  if (args.action.type === "END_ROUND") return false;
  return true;
}

/** Build the connected-players list for a room and broadcast it. */
async function broadcastPlayers(io: IOServer, roomId: string) {
  const sockets = await io.in(roomId).fetchSockets();
  const players = sockets.map((s) => ({
    id: s.id,
    name: (s.data.playerName as string) || "Anonyme",
    role: (s.data.role as "public" | "master") || "public",
    teamId: (s.data.teamId as string | null) ?? null,
  }));
  io.to(roomId).emit("room:players", players);
}

/** Broadcast current lobby state to all sockets in the room. */
function broadcastLobby(io: IOServer, room: Room) {
  if (!room.lobby) return;
  io.to(room.id).emit("lobby:state", {
    hostSocketId: room.lobby.hostSocketId,
    players: room.lobby.players,
    config: room.lobby.config,
    started: room.lobby.started,
  });
}

/* ─── Handler ──────────────────────────────────────────────── */

export default function handler(req: NextApiRequest, res: NextResWithSocket) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socket/io",
      addTrailingSlash: false,
    });
    res.socket.server.io = io;
    ioRef = io;

    io.on("connection", (socket) => {
      socket.data.roomId = null as string | null;
      socket.data.isMaster = false as boolean;
      socket.data.playerName = "" as string;
      socket.data.role = "public" as string;

      /* ─── Lobby events ─────────────────────────────────── */

      socket.on(
        "lobby:join",
        async (
          payload: { roomId: string; playerName: string },
          ack?: (r: { ok: boolean; isHost?: boolean; error?: string }) => void,
        ) => {
          const room = getRoom(payload.roomId);
          if (!room) {
            ack?.({ ok: false, error: "ROOM_NOT_FOUND" });
            return;
          }
          if (!room.lobby) {
            ack?.({ ok: false, error: "NO_LOBBY" });
            return;
          }
          if (room.lobby.started) {
            ack?.({ ok: false, error: "GAME_ALREADY_STARTED" });
            return;
          }

          socket.data.roomId = payload.roomId;
          socket.data.playerName = (payload.playerName ?? "").trim() || "Anonyme";
          socket.join(payload.roomId);

          // Add player if not already present
          const existing = room.lobby.players.find((p) => p.socketId === socket.id);
          if (!existing) {
            room.lobby.players.push({
              socketId: socket.id,
              name: socket.data.playerName as string,
              teamId: null,
            });
          }

          // First player becomes host
          if (!room.lobby.hostSocketId) {
            room.lobby.hostSocketId = socket.id;
          }

          const isHost = socket.id === room.lobby.hostSocketId;
          ack?.({ ok: true, isHost });
          broadcastLobby(io, room);
        },
      );

      socket.on("lobby:chooseTeam", (payload: { teamId: LobbyTeamId | null }) => {
        const roomId = socket.data.roomId as string | null;
        if (!roomId) return;
        const room = getRoom(roomId);
        if (!room?.lobby || room.lobby.started) return;

        // Validate team choice against lobby config
        if (payload.teamId === "green" && room.lobby.config.teamsCount < 3) return;
        if (payload.teamId === "yellow" && room.lobby.config.teamsCount < 4) return;

        const player = room.lobby.players.find((p) => p.socketId === socket.id);
        if (player) {
          player.teamId = payload.teamId;
          broadcastLobby(io, room);
        }
      });

      socket.on("lobby:shuffle", () => {
        const roomId = socket.data.roomId as string | null;
        if (!roomId) return;
        const room = getRoom(roomId);
        if (!room?.lobby || room.lobby.started) return;

        // Only the host can shuffle
        if (socket.id !== room.lobby.hostSocketId) return;

        const teamsCount = room.lobby.config.teamsCount;
        const allTeamIds: LobbyTeamId[] = ["red", "blue", "green", "yellow"];
        const teamIds = allTeamIds.slice(0, teamsCount);

        // Shuffle all players randomly across teams (round-robin on shuffled list)
        const shuffled = [...room.lobby.players];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        for (let i = 0; i < shuffled.length; i++) {
          shuffled[i].teamId = teamIds[i % teamIds.length];
        }

        broadcastLobby(io, room);
      });

      socket.on("lobby:start", async () => {
        const roomId = socket.data.roomId as string | null;
        if (!roomId) return;
        const room = getRoom(roomId);
        if (!room?.lobby || room.lobby.started) return;

        // Only the host can start
        if (socket.id !== room.lobby.hostSocketId) return;

        const teamsCount = room.lobby.config.teamsCount;
        const allTeamIds: LobbyTeamId[] = ["red", "blue", "green", "yellow"];
        const teamIds = allTeamIds.slice(0, teamsCount);

        const teamPlayers: Record<string, typeof room.lobby.players> = {};
        for (const tid of teamIds) {
          teamPlayers[tid] = room.lobby.players.filter((p) => p.teamId === tid);
          if (teamPlayers[tid].length < 2) {
            socket.emit("lobby:error", { code: "TEAMS_NOT_READY" });
            return;
          }
        }

        // Randomly pick one spymaster per team
        const spymasterSocketIds = new Set<string>();
        for (const tid of teamIds) {
          const tp = teamPlayers[tid];
          const spy = tp[Math.floor(Math.random() * tp.length)];
          spymasterSocketIds.add(spy.socketId);
        }

        // Build the player list for the game engine
        const allPlayers = room.lobby.players
          .filter((p) => p.teamId !== null)
          .map((p) => ({ name: p.name, teamId: p.teamId as TeamId }));

        // Create game state via the engine
        const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
        const state = reduce(null, {
          type: "CREATE_MATCH",
          payload: {
            seed,
            config: { teamsCount, roundsToWinMatch: room.lobby.config.roundsToWinMatch },
            players: allPlayers,
          },
        });

        room.state = state;
        room.lobby.started = true;

        // Save host player name for reset-match authorization
        const hostPlayer = room.lobby.players.find((p) => p.socketId === room.lobby!.hostSocketId);
        room.hostPlayerName = hostPlayer?.name ?? null;

        // Store player→team mapping for team validation during game
        for (const p of room.lobby.players) {
          if (p.teamId) {
            room.playerTeams.set(p.name, p.teamId);
          }
        }

        // Notify each connected socket of their assigned role
        const sockets = await io.in(roomId).fetchSockets();
        for (const s of sockets) {
          const isSpy = spymasterSocketIds.has(s.id);
          s.emit("lobby:gameStarted", {
            role: isSpy ? "spymaster" : "guesser",
            masterPin: isSpy ? room.masterPin : undefined,
          });
        }
      });

      /* ─── Game events ──────────────────────────────────── */

      socket.on("room:join", async (payload: JoinPayload, ack?: (r: JoinAck) => void) => {
        const room = getRoom(payload.roomId);
        if (!room) {
          ack?.({ ok: false, error: "ROOM_NOT_FOUND" });
          socket.emit("room:error", { code: "ROOM_NOT_FOUND" });
          return;
        }
        if (!room.state) {
          ack?.({ ok: false, error: "GAME_NOT_STARTED" });
          socket.emit("room:error", { code: "GAME_NOT_STARTED" });
          return;
        }

        const wantsMaster = payload.role === "master";
        const pin = (payload.pin ?? "").trim();
        const isMaster = wantsMaster && pin !== "" && pin === room.masterPin;

        socket.data.roomId = payload.roomId;
        socket.data.isMaster = isMaster;
        socket.data.playerName = (payload.playerName ?? "").trim() || "Anonyme";
        socket.data.role = payload.role;
        // Look up the player's team from the lobby mapping
        socket.data.teamId = room.playerTeams.get(socket.data.playerName as string) ?? null;

        socket.join(payload.roomId);

        const stateToSend = isMaster ? room.state : sanitizeStateForPublic(room.state);
        socket.emit("room:state", stateToSend);
        const isHost = room.hostPlayerName != null &&
          (socket.data.playerName as string) === room.hostPlayerName;
        const playerTeamId = socket.data.teamId as string | null;
        ack?.({ ok: true, isMaster, isHost, teamId: playerTeamId });

        // Broadcast updated player list
        await broadcastPlayers(io, payload.roomId);
      });

      socket.on("room:action", async (payload: { roomId: string; action: Action }) => {
        const roomId = payload.roomId;
        const room = getRoom(roomId);
        if (!room || !room.state) {
          socket.emit("room:error", { code: "ROOM_NOT_FOUND" });
          return;
        }

        const isMaster = Boolean(socket.data.isMaster);
        if (!canCallAction({ isMaster, action: payload.action })) {
          socket.emit("room:error", { code: "FORBIDDEN" });
          return;
        }

        // Host-only actions: only the game host can reset the match
        if (payload.action.type === "RESET_MATCH") {
          const playerName = (socket.data.playerName as string) || "";
          if (room.hostPlayerName && playerName !== room.hostPlayerName) {
            socket.emit("room:error", { code: "HOST_ONLY" });
            return;
          }
        }

        // Team-gated actions: only the active team's players can act
        const teamGatedActions = new Set(["REVEAL_CARD", "STOP_GUESSING", "END_TURN"]);
        if (teamGatedActions.has(payload.action.type) && !isMaster) {
          const playerTeamId = socket.data.teamId as string | null;
          if (playerTeamId !== room.state.activeTeamId) {
            socket.emit("room:error", { code: "NOT_YOUR_TURN" });
            return;
          }
        }

        // GIVE_CLUE: only the active team's spymaster can give clues
        if (payload.action.type === "GIVE_CLUE" && isMaster) {
          const playerTeamId = socket.data.teamId as string | null;
          if (playerTeamId !== room.state.activeTeamId) {
            socket.emit("room:error", { code: "NOT_YOUR_TURN" });
            return;
          }
        }

        const next = reduce(room.state, payload.action);
        updateRoomState(roomId, next);

        if (!ioRef) return;

        // Detect spymaster rotation on round-changing actions
        const roundActions = new Set(["NEXT_ROUND", "START_ROUND", "RESET_MATCH"]);
        if (roundActions.has(payload.action.type)) {
          // Build set of current spymaster player names from new state
          const spymasterNames = new Set<string>();
          for (const team of Object.values(next.teams)) {
            const spyId = team.playerIds[team.spymasterIndex];
            if (spyId && next.players[spyId]) {
              spymasterNames.add(next.players[spyId].name);
            }
          }

          const sockets = await ioRef.in(roomId).fetchSockets();
          for (const s of sockets) {
            const pName = s.data.playerName as string;
            const wasMaster = Boolean(s.data.isMaster);
            const isNowSpy = spymasterNames.has(pName);

            // Update socket flags
            s.data.isMaster = isNowSpy;
            s.data.role = isNowSpy ? "master" : "public";

            // Send state with correct view
            s.emit("room:state", isNowSpy ? next : sanitizeStateForPublic(next));

            // Notify role change so clients can redirect
            if (wasMaster !== isNowSpy) {
              s.emit("room:roleChange", {
                role: isNowSpy ? "spymaster" : "guesser",
                masterPin: isNowSpy ? room.masterPin : undefined,
              });
            }
          }
        } else {
          // Normal broadcast (no role changes)
          const sockets = await ioRef.in(roomId).fetchSockets();
          for (const s of sockets) {
            const sendMaster = Boolean(s.data.isMaster);
            s.emit("room:state", sendMaster ? next : sanitizeStateForPublic(next));
          }
        }
      });

      /* ─── Disconnect ───────────────────────────────────── */

      socket.on("disconnecting", async () => {
        const roomId = socket.data.roomId as string | null;
        if (!roomId) return;
        const room = getRoom(roomId);
        if (!room) return;

        // Lobby disconnect: remove player, reassign host if needed
        if (room.lobby && !room.lobby.started) {
          room.lobby.players = room.lobby.players.filter((p) => p.socketId !== socket.id);
          if (room.lobby.hostSocketId === socket.id && room.lobby.players.length > 0) {
            room.lobby.hostSocketId = room.lobby.players[0].socketId;
          }
          setTimeout(() => {
            if (ioRef) broadcastLobby(ioRef, room);
          }, 100);
        }

        // Game disconnect: update connected-players list
        if (room.state && ioRef) {
          setTimeout(() => {
            if (ioRef) broadcastPlayers(ioRef, roomId);
          }, 100);
        }
      });
    });
  }

  res.end();
}
