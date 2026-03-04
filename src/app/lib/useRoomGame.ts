"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Action, GameState } from "@/engine/types";
import { reduce } from "@/engine/reducer";
import { loadRoomState, saveRoomState } from "./roomStore";

const LOCAL_EVENT = "codename:room:changed";

function subscribe(roomId: string, onStoreChange: () => void) {
  function handler() {
    onStoreChange();
  }
  function storageHandler(e: StorageEvent) {
    if (!e.key) return;
    if (!e.key.includes(`codename:room:${roomId}:state`)) return;
    onStoreChange();
  }
  window.addEventListener("storage", storageHandler);
  window.addEventListener(LOCAL_EVENT, handler);
  return () => {
    window.removeEventListener("storage", storageHandler);
    window.removeEventListener(LOCAL_EVENT, handler);
  };
}

function getSnapshot(roomId: string): GameState | null {
  return loadRoomState(roomId);
}

export function useRoomGame(roomId: string) {
  const state = useSyncExternalStore(
    (cb) => subscribe(roomId, cb),
    () => getSnapshot(roomId),
    () => null,
  );

  const dispatch = useCallback(
    (action: Action) => {
      const prev = loadRoomState(roomId);
      if (!prev) return;
      const next = reduce(prev, action);
      saveRoomState(roomId, next);
      window.dispatchEvent(new Event(LOCAL_EVENT));
    },
    [roomId],
  );

  const api = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return api;
}

