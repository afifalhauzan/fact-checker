import { NextRequest } from "next/server";
import { backendFetch, getAccessToken, internalKeyHeader } from "@/lib/server-auth";
import { backendUnavailable, errorResponse, relay, signInRequired } from "@/lib/telaah-bersama/proxy";
import type { TelaahPost } from "@/lib/telaah-bersama/types";
import { hasSensitiveData } from "@/langchain/agents/analyzer/redaction";

/**
 * A report is checked before it can hide anything (design doc 5.3): the post is rescanned for
 * personal data, so a false report cannot take down a post that exposes a scammer's number.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAccessToken(req);
  if (!token) return signInRequired();
  const { id } = await params;
  if (!/^\d+$/.test(id)) return errorResponse("Telaah tidak ditemukan.", 404);

  const body = await req.json().catch(() => null);
  if (body?.type !== "data_pribadi" && body?.type !== "spam") return errorResponse("Jenis laporan tidak dikenal.", 422);

  try {
    const current = await backendFetch(`/telaah-bersama/${id}`, { token, cache: "no-store" });
    if (!current.ok) return relay(current);
    const post = (await current.json()) as TelaahPost;
    const text = [post.title, post.story ?? "", ...post.materialLines, ...(post.comments ?? []).map((comment) => comment.body)];

    const response = await backendFetch(`/telaah-bersama/${id}/reports`, {
      method: "POST",
      token,
      headers: internalKeyHeader(),
      body: JSON.stringify({ type: body.type, sensitive_found: hasSensitiveData(text.join("\n")) }),
    });
    return relay(response);
  } catch (error) {
    return backendUnavailable(error);
  }
}
