"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Action, GameState } from "@/engine/types";
import { joinRoom, onError, onPlayers, onRoleChange, onState, onTimer, sendAction } from "./socketClient";
import type { ConnectedPlayer, RoleChangeInfo } from "./socketClient";

export function useRoomOnlineGame(args: {
  roomId: string;
  role: "public" | "master";
  pin?: string;
  playerName?: string;
}) {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverIsMaster, setServerIsMaster] = useState<boolean | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<ConnectedPlayer[]>([]);
  const [roleChange, setRoleChange] = useState<RoleChangeInfo | null>(null);
  const [timerDeadline, setTimerDeadline] = useState<number | null>(null);

  useEffect(() => {
    let unsubState: null | (() => void) = null;
    let unsubErr: null | (() => void) = null;
    let unsubPlayers: null | (() => void) = null;
    let unsubRole: null | (() => void) = null;
    let unsubTimer: null | (() => void) = null;
    let cancelled = false;

    (async () => {
      unsubState = await onState((s) => setState(s));
      unsubErr = await onError((e) => setError(e?.code ?? "ERROR"));
      unsubPlayers = await onPlayers((p) => setConnectedPlayers(p));
      unsubRole = await onRoleChange((info) => setRoleChange(info));
      unsubTimer = await onTimer((info) => setTimerDeadline(info.deadline));
      const resp = await joinRoom({
        roomId: args.roomId,
        role: args.role,
        pin: args.pin,
        playerName: args.playerName,
      });
      if (cancelled) return;
      if (!resp.ok) setError(resp.error ?? "ERROR");
      setServerIsMaster(Boolean(resp.isMaster));
      setIsHost(Boolean(resp.isHost));
      setMyTeamId(resp.teamId ?? null);
    })();

    return () => {
      cancelled = true;
      unsubState?.();
      unsubErr?.();
      unsubPlayers?.();
      unsubRole?.();
      unsubTimer?.();
    };
  }, [args.roomId, args.role, args.pin, args.playerName]);

  const dispatch = useCallback(
    (action: Action) => {
      void sendAction(args.roomId, action);
    },
    [args.roomId],
  );

  return useMemo(
    () => ({ state, dispatch, error, serverIsMaster, isHost, myTeamId, connectedPlayers, roleChange, timerDeadline }),
    [state, dispatch, error, serverIsMaster, isHost, myTeamId, connectedPlayers, roleChange, timerDeadline],
  );
}
