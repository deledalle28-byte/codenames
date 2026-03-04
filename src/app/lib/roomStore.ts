import type { GameState } from "@/engine/types";

function keyFor(roomId: string) {
  return `codename:room:${roomId}:state`;
}

export function loadRoomState(roomId: string): GameState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(keyFor(roomId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function saveRoomState(roomId: string, state: GameState) {
  window.localStorage.setItem(keyFor(roomId), JSON.stringify(state));
}

export function subscribeRoom(roomId: string, onChange: (next: GameState) => void) {
  const k = keyFor(roomId);
  function handler(e: StorageEvent) {
    if (e.key !== k) return;
    if (!e.newValue) return;
    try {
      onChange(JSON.parse(e.newValue) as GameState);
    } catch {
      // ignore
    }
  }
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

