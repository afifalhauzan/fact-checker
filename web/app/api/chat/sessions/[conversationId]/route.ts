import { NextRequest, NextResponse } from "next/server";
import { backendFetch, getAccessToken } from "@/lib/server-auth";

type RouteContext = { params: Promise<{ conversationId: string }> };

/** Pins or unpins a session in the sidebar. */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { conversationId } = await params;
  const token = getAccessToken(req);

  if (!token) {
    return NextResponse.json({ saved: false }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.pinned !== "boolean") {
    return NextResponse.json({ saved: false }, { status: 422 });
  }

  try {
    const response = await backendFetch(`/conversations/${encodeURIComponent(conversationId)}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ pinned: body.pinned }),
    });

    return NextResponse.json({ saved: response.ok }, { status: response.status });
  } catch (error) {
    console.error("[ROUTE] Failed to pin chat session:", error);
    return NextResponse.json({ saved: false }, { status: 502 });
  }
}

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
