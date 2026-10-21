import { NextRequest } from "next/server";
import { backendFetch, getAccessToken, internalKeyHeader } from "@/lib/server-auth";
import { backendUnavailable, errorResponse, relay, signInRequired } from "@/lib/telaah-bersama/proxy";
import { redactSensitive } from "@/langchain/agents/analyzer/redaction";
import { flagComment } from "@/langchain/agents/telaah-bersama/moderation";

const MAX_COMMENT_LENGTH = 1_000;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAccessToken(req);
  if (!token) return signInRequired();
  const { id } = await params;
  if (!/^\d+$/.test(id)) return errorResponse("Telaah tidak ditemukan.", 404);

  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, MAX_COMMENT_LENGTH) : "";
  if (!text) return errorResponse("Komentar tidak boleh kosong.", 422);

  try {
    const response = await backendFetch(`/telaah-bersama/${id}/comments`, {
      method: "POST",
      token,
      headers: internalKeyHeader(),
      body: JSON.stringify({ body: redactSensitive(text), flag: flagComment(text) }),
    });
    return relay(response);
  } catch (error) {
    return backendUnavailable(error);
  }
}
