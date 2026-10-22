import { NextRequest } from "next/server";
import { backendFetch, getAccessToken, internalKeyHeader } from "@/lib/server-auth";
import { backendUnavailable, errorResponse, relay, signInRequired } from "@/lib/telaah-bersama/proxy";
import type { TelaahPost } from "@/lib/telaah-bersama/types";
import { hasSensitiveData } from "@/langchain/agents/analyzer/redaction";

/**
 * Same safeguard as reporting a post (design doc 5.3): the comment is rescanned for personal
 * data, so a false report cannot hide a comment that warns others about a scam.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const token = getAccessToken(req);
  if (!token) return signInRequired();
  const { id, commentId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(commentId)) return errorResponse("Komentar tidak ditemukan.", 404);

  const body = await req.json().catch(() => null);
  if (body?.type !== "data_pribadi" && body?.type !== "spam") return errorResponse("Jenis laporan tidak dikenal.", 422);

  try {
    const current = await backendFetch(`/telaah-bersama/${id}`, { token, cache: "no-store" });
    if (!current.ok) return relay(current);
    const post = (await current.json()) as TelaahPost;
    const comment = post.comments?.find((item) => item.id === Number(commentId));
    if (!comment?.body) return errorResponse("Komentar tidak ditemukan.", 404);

    const response = await backendFetch(`/telaah-bersama/${id}/comments/${commentId}/reports`, {
      method: "POST",
      token,
      headers: internalKeyHeader(),
      body: JSON.stringify({ type: body.type, sensitive_found: hasSensitiveData(comment.body) }),
    });
    return relay(response);
  } catch (error) {
    return backendUnavailable(error);
  }
}
