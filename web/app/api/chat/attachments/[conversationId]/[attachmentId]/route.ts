import { NextRequest, NextResponse } from "next/server";
import { backendFetch, getAccessToken } from "@/lib/server-auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A file the signed-in user sent in one of their TelaahLoker sessions; Laravel checks ownership. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId: string; attachmentId: string }> }) {
  const { conversationId, attachmentId } = await params;
  const token = getAccessToken(req);
  if (!token || !UUID.test(conversationId) || !UUID.test(attachmentId)) return new NextResponse(null, { status: 404 });

  try {
    const response = await backendFetch(`/conversations/${conversationId}/attachments/${attachmentId}`, { token });
    if (!response.ok) return new NextResponse(null, { status: response.status });

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
        "Content-Disposition": response.headers.get("Content-Disposition") ?? "inline",
        // These can be KTP photos: no copy stays in the browser after logout or deletion
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[ROUTE] Failed to load a chat attachment:", error);
    return new NextResponse(null, { status: 502 });
  }
}
