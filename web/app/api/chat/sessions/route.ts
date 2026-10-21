import { NextRequest, NextResponse } from "next/server";
import { backendFetch, getAccessToken } from "@/lib/server-auth";

const NO_CACHE = { "Cache-Control": "no-cache" };

/** The signed-in user's chat sessions, most recent first. Guests have none: their chats are not stored. */
export async function GET(req: NextRequest) {
  const token = getAccessToken(req);

  if (!token) {
    return NextResponse.json({ data: [], guest: true }, { headers: NO_CACHE });
  }

  try {
    const response = await backendFetch("/conversations", { token, cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json({ data: [], guest: response.status === 401 }, { status: response.status, headers: NO_CACHE });
    }

    return NextResponse.json(await response.json(), { headers: NO_CACHE });
  } catch (error) {
    console.error("[ROUTE] Failed to load chat sessions:", error);
    return NextResponse.json({ data: [] }, { status: 502, headers: NO_CACHE });
  }
}
