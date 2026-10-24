import { NextRequest, NextResponse } from "next/server";
import { backendFetch, getAccessToken } from "@/lib/server-auth";
import { GUEST_COOKIE, SESSION_TOKEN_BUDGET, guestSessionOf, toState } from "@/lib/quota";

const NO_CACHE = { "Cache-Control": "no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The viewer's TelaahLoker quota, and how much of one session they have used. */
export async function GET(req: NextRequest) {
  const token = getAccessToken(req);
  const conversationId = req.nextUrl.searchParams.get("conversation_id");

  // A guest's usage is only known to the chat stream; the page needs to know which session is theirs
  if (!token) {
    return NextResponse.json(
      { guest: true, guestSessionId: guestSessionOf(req.cookies.get(GUEST_COOKIE)?.value), sessionTokens: 0, sessionBudget: SESSION_TOKEN_BUDGET },
      { headers: NO_CACHE }
    );
  }

  try {
    const query = conversationId && UUID.test(conversationId) ? `?conversation_id=${conversationId}` : "";
    const response = await backendFetch(`/quota${query}`, { token, cache: "no-store" });
    if (!response.ok) return NextResponse.json(null, { status: response.status, headers: NO_CACHE });
    return NextResponse.json(toState(await response.json()), { headers: NO_CACHE });
  } catch (error) {
    console.error("[ROUTE] Failed to load the quota:", error);
    return NextResponse.json(null, { status: 502, headers: NO_CACHE });
  }
}
