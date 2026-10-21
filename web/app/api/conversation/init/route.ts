import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const NO_CACHE = { "Cache-Control": "no-cache" };

// Every visit to /chat starts a new session (one session per posting); earlier sessions are reopened
// from the session history. The backend creates the conversation when its first message is saved.
export async function POST() {
  return NextResponse.json({ id: randomUUID() }, { headers: NO_CACHE });
}
