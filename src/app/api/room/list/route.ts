import { NextResponse } from "next/server";
import { listRoomSummaries } from "@/server/rooms";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ rooms: listRoomSummaries() });
}
