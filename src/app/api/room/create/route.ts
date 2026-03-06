import { NextResponse } from "next/server";
import { generateRoomId, upsertRoom } from "@/server/rooms";

export const runtime = "nodejs";

type Body = {
  roundsToWinMatch?: number;
  teamsCount?: number;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const roundsToWinMatch = Math.max(1, Math.floor(body.roundsToWinMatch ?? 3));
  const teamsCount = Math.max(2, Math.min(3, Math.floor(body.teamsCount ?? 2)));

  // Auto-generate a 4-digit PIN for the master view
  const masterPin = String(Math.floor(1000 + Math.random() * 9000));

  const roomId = generateRoomId();

  upsertRoom({
    id: roomId,
    state: null, // no game state yet — created when host starts from lobby
    masterPin,
    createdAt: Date.now(),
    lobby: {
      hostSocketId: "",
      players: [],
      config: { roundsToWinMatch, teamsCount },
      started: false,
    },
    playerTeams: new Map(),
    hostPlayerName: null,
  });

  return NextResponse.json({ roomId });
}
