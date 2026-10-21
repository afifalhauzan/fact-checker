import { NextRequest, NextResponse } from "next/server";
import { backendFetch, getAccessToken } from "@/lib/server-auth";
import { backendUnavailable } from "@/lib/telaah-bersama/proxy";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new NextResponse(null, { status: 404 });

  try {
    const response = await backendFetch(`/telaah-bersama/attachments/${id}`, { token: getAccessToken(req) });
    if (!response.ok) return new NextResponse(null, { status: response.status });

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return backendUnavailable(error);
  }
}
