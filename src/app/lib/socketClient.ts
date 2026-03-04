"use client";

import { io, type Socket } from "socket.io-client";
import type { Action, GameState } from "@/engine/types";

let socket: Socket | null = null;

type JoinAck = { ok: boolean; isMaster?: boolean; error?: string };
type RoomError = { code?: string };

/**
 * Returns the singleton Socket.io client.
 * Socket.io automatically buffers emits until connected,
 * so callers don't need to wait for the "connect" event.
 */
export async function getSocket(): Promise<Socket> {
  if (socket) return socket;
  // Trigger the Pages-Router handler so the Socket.io server is mounted
  await fetch("/api/socket");
  socket = io({
    path: "/api/socket/io",
    transports: ["websocket", "polling"],
  });
  return socket;
}

/* ─── Connected players (in-game) ──────────────────────────── */

export type ConnectedPlayer = { id: string; name: string; role: "public" | "master" };

export type JoinArgs = { roomId: string; role: "public" | "master"; pin?: string; playerName?: string };

export async function joinRoom(args: JoinArgs) {
  const s = await getSocket();
  return new Promise<JoinAck>((resolve) => {
    s.emit("room:join", args, (resp: unknown) => resolve((resp as JoinAck) ?? { ok: true }));
  });
}

export async function sendAction(roomId: string, action: Action) {
  const s = await getSocket();
  s.emit("room:action", { roomId, action } satisfies { roomId: string; action: Action });
}

export async function onState(handler: (state: GameState) => void) {
  const s = await getSocket();
  s.on("room:state", handler);
  return () => s.off("room:state", handler);
}

export async function onError(handler: (err: RoomError) => void) {
  const s = await getSocket();
  s.on("room:error", handler);
  return () => s.off("room:error", handler);
}

export async function onPlayers(handler: (players: ConnectedPlayer[]) => void) {
  const s = await getSocket();
  s.on("room:players", handler);
  return () => s.off("room:players", handler);
}

/* ─── Lobby ────────────────────────────────────────────────── */

export type LobbyPlayer = {
  socketId: string;
  name: string;
  teamId: "red" | "blue" | null;
};

export type LobbyState = {
  hostSocketId: string;
  players: LobbyPlayer[];
  config: { roundsToWinMatch: number };
  started: boolean;
};

export type GameStartInfo = {
  role: "spymaster" | "guesser";
  masterPin?: string;
};

export async function joinLobby(args: { roomId: string; playerName: string }) {
  const s = await getSocket();
  return new Promise<{ ok: boolean; isHost?: boolean; error?: string }>((resolve) => {
    s.emit("lobby:join", args, (resp: unknown) =>
      resolve((resp as { ok: boolean; isHost?: boolean; error?: string }) ?? { ok: true }),
    );
  });
}

export async function lobbyChooseTeam(teamId: "red" | "blue" | null) {
  const s = await getSocket();
  s.emit("lobby:chooseTeam", { teamId });
}

export async function lobbyStart() {
  const s = await getSocket();
  s.emit("lobby:start");
}

export async function onLobbyState(handler: (state: LobbyState) => void) {
  const s = await getSocket();
  s.on("lobby:state", handler);
  return () => s.off("lobby:state", handler);
}

export async function onGameStarted(handler: (info: GameStartInfo) => void) {
  const s = await getSocket();
  s.on("lobby:gameStarted", handler);
  return () => s.off("lobby:gameStarted", handler);
}

export async function onLobbyError(handler: (err: { code?: string }) => void) {
  const s = await getSocket();
  s.on("lobby:error", handler);
  return () => s.off("lobby:error", handler);
}
