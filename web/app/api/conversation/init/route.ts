import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { backendFetch, getAccessToken } from "@/lib/server-auth";

const NO_CACHE = { "Cache-Control": "no-cache" };

// An account keeps a single conversation, so a signed-in user gets theirs back
// (e.g. after logging in again) instead of a fresh id.
async function findExistingConversationId(token: string): Promise<string | null> {
  try {
    const response = await backendFetch("/conversations", { token, cache: "no-store" });
    if (!response.ok) return null;

    const body = await response.json();
    const id = body?.data?.[0]?.id;

    return typeof id === "string" ? id : null;
  } catch (error) {
    console.error("[ROUTE] Failed to look up existing conversation:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const token = getAccessToken(req);
  const existingId = token ? await findExistingConversationId(token) : null;

  return NextResponse.json({ id: existingId ?? randomUUID() }, { headers: NO_CACHE });
}
