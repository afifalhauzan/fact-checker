import { NextRequest } from "next/server";
import { backendFetch, getAccessToken, internalKeyHeader } from "@/lib/server-auth";
import { backendUnavailable, errorResponse, relay, signInRequired } from "@/lib/telaah-bersama/proxy";

/** Likes or unlikes someone else's comment. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const token = getAccessToken(req);
  if (!token) return signInRequired();
  const { id, commentId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(commentId)) return errorResponse("Komentar tidak ditemukan.", 404);

  try {
    return relay(
      await backendFetch(`/telaah-bersama/${id}/comments/${commentId}/like`, { method: "POST", token, headers: internalKeyHeader() })
    );
  } catch (error) {
    return backendUnavailable(error);
  }
}
