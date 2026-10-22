import { NextRequest } from "next/server";
import { backendFetch, getAccessToken, internalKeyHeader } from "@/lib/server-auth";
import { backendUnavailable, errorResponse, relay, signInRequired } from "@/lib/telaah-bersama/proxy";
import { hasSensitiveData, redactSensitive } from "@/langchain/agents/analyzer/redaction";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_STORY_LENGTH = 1_500;

async function postId(context: RouteContext): Promise<string | null> {
  const { id } = await context.params;
  return /^\d+$/.test(id) ? id : null;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const id = await postId(context);
  if (!id) return errorResponse("Telaah tidak ditemukan.", 404);

  try {
    return relay(await backendFetch(`/telaah-bersama/${id}`, { token: getAccessToken(req), cache: "no-store" }));
  } catch (error) {
    return backendUnavailable(error);
  }
}

/**
 * Owner edit. The story is redacted here, and the post is rescanned so that one hidden after a
 * personal-data report reappears only once it is clean.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  const token = getAccessToken(req);
  if (!token) return signInRequired();
  const id = await postId(context);
  if (!id) return errorResponse("Telaah tidak ditemukan.", 404);

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !Array.isArray(body.materialLines)) {
    return errorResponse("Data suntingan tidak lengkap.", 422);
  }

  try {
    const title = redactSensitive(body.title.trim());
    const story = typeof body.story === "string" ? redactSensitive(body.story.trim()).slice(0, MAX_STORY_LENGTH) : "";
    const materialLines: string[] = body.materialLines.filter((line: unknown) => typeof line === "string");

    const response = await backendFetch(`/telaah-bersama/${id}`, {
      method: "PATCH",
      token,
      headers: internalKeyHeader(),
      body: JSON.stringify({
        title,
        story: story || null,
        material_lines: materialLines,
        links: Array.isArray(body.links) ? body.links : [],
        attachment_ids: Array.isArray(body.attachmentIds) ? body.attachmentIds : [],
        still_sensitive: hasSensitiveData([title, story, ...materialLines].join("\n")),
      }),
    });
    return relay(response);
  } catch (error) {
    return backendUnavailable(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const token = getAccessToken(req);
  if (!token) return signInRequired();
  const id = await postId(context);
  if (!id) return errorResponse("Telaah tidak ditemukan.", 404);

  try {
    return relay(await backendFetch(`/telaah-bersama/${id}`, { method: "DELETE", token, headers: internalKeyHeader() }));
  } catch (error) {
    return backendUnavailable(error);
  }
}
