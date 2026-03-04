"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getSocket,
  joinLobby,
  onLobbyState,
  onGameStarted,
  onLobbyError,
  lobbyChooseTeam,
  lobbyStart,
} from "./socketClient";
import type { LobbyState, GameStartInfo } from "./socketClient";

export function useLobby(args: { roomId: string; playerName: string }) {
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [gameStarted, setGameStarted] = useState<GameStartInfo | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [socketId, setSocketId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Use a ref so the effect doesn't re-run when playerName changes
  const playerNameRef = useRef(args.playerName);
  playerNameRef.current = args.playerName;

  useEffect(() => {
    let cancelled = false;
    const unsubs: Array<() => void> = [];

    (async () => {
      try {
        const s = await getSocket();
        if (cancelled) return;

        // Track socket id (available once connected)
        const updateId = () => {
          if (!cancelled) setSocketId(s.id ?? "");
        };
        if (s.connected) updateId();
        s.on("connect", updateId);
        unsubs.push(() => s.off("connect", updateId));

        // Lobby state listener
        unsubs.push(
          await onLobbyState((state) => {
            if (cancelled) return;
            setLobby(state);
            // Re-check isHost with latest socket id
            setIsHost(state.hostSocketId === (s.id ?? ""));
          }),
        );

        unsubs.push(
          await onGameStarted((info) => {
            if (cancelled) return;
            setGameStarted(info);
          }),
        );

        unsubs.push(
          await onLobbyError((err) => {
            if (cancelled) return;
            setError(err.code ?? "ERROR");
          }),
        );

        // Join lobby (Socket.io buffers this until connected)
        const resp = await joinLobby({
          roomId: args.roomId,
          playerName: playerNameRef.current || "Anonyme",
        });
        if (cancelled) return;
        if (!resp.ok) setError(resp.error ?? "ERROR");
        if (resp.isHost) setIsHost(true);
      } catch (err) {
        if (!cancelled) {
          console.error("[useLobby] connection error:", err);
          setError("CONNECTION_FAILED");
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
    // Only depend on roomId — playerName is read from ref
  }, [args.roomId]);

  const chooseTeam = useCallback((teamId: "red" | "blue" | null) => {
    lobbyChooseTeam(teamId);
  }, []);

  const start = useCallback(() => {
    lobbyStart();
  }, []);

  return useMemo(
    () => ({ lobby, gameStarted, isHost, socketId, error, chooseTeam, start }),
    [lobby, gameStarted, isHost, socketId, error, chooseTeam, start],
  );
}
