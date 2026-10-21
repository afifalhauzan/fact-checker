import { NextRequest, NextResponse } from "next/server";
import { backendFetch, getAccessToken } from "@/lib/server-auth";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { conversationId } = await params;
  const token = getAccessToken(req);

  if (!token) {
    return NextResponse.json({ deleted: false }, { status: 401 });
  }

  try {
    const response = await backendFetch(`/conversations/${encodeURIComponent(conversationId)}`, {
      method: "DELETE",
      token,
    });

    return NextResponse.json({ deleted: response.ok }, { status: response.status });
  } catch (error) {
    console.error("[ROUTE] Failed to delete chat session:", error);
    return NextResponse.json({ deleted: false }, { status: 502 });
  }
}
