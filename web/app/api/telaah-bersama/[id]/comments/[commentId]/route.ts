import { NextRequest } from "next/server";
import { backendFetch, getAccessToken, internalKeyHeader } from "@/lib/server-auth";
import { backendUnavailable, errorResponse, relay, signInRequired } from "@/lib/telaah-bersama/proxy";

/** Deletes the viewer's own comment (and its replies). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const token = getAccessToken(req);
  if (!token) return signInRequired();
  const { id, commentId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(commentId)) return errorResponse("Komentar tidak ditemukan.", 404);

  try {
    return relay(
      await backendFetch(`/telaah-bersama/${id}/comments/${commentId}`, { method: "DELETE", token, headers: internalKeyHeader() })
    );
  } catch (error) {
    return backendUnavailable(error);
  }
}
