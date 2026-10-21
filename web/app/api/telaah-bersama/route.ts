import { NextRequest } from "next/server";
import { backendFetch, getAccessToken, internalKeyHeader } from "@/lib/server-auth";
import { backendUnavailable, errorResponse, relay, signInRequired } from "@/lib/telaah-bersama/proxy";
import { SOURCE_PLATFORMS } from "@/lib/telaah-bersama/types";
import { redactSensitive } from "@/langchain/agents/analyzer/redaction";
import { hasValidAttributes, type DraftAttributes } from "@/langchain/agents/telaah-bersama/draft";
import { embedText, embeddingTextFor } from "@/langchain/agents/telaah-bersama/embeddings";
import { findContacts } from "@/langchain/agents/telaah-bersama/identifiers";
import { isSubsequence, readSignedShare, sha256OfBytes } from "@/langchain/agents/telaah-bersama/share-payload";

const MAX_TITLE_LENGTH = 120;
const MAX_STORY_LENGTH = 1_500;

/** Public list; the viewer's token (if any) only adds "reacted" and "isOwner" flags. */
export async function GET(req: NextRequest) {
  try {
    const response = await backendFetch(`/telaah-bersama?${req.nextUrl.searchParams.toString()}`, {
      token: getAccessToken(req),
      cache: "no-store",
    });
    return relay(response);
  } catch (error) {
    return backendUnavailable(error);
  }
}

function parseJson<T>(value: FormDataEntryValue | null): T | null {
  try {
    return typeof value === "string" ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

interface PostEdits {
  title?: unknown;
  story?: unknown;
  materialLines?: unknown;
  links?: unknown;
  sourcePlatform?: unknown;
  sourceAccount?: unknown;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

/**
 * Publishes a post from a signed analysis (design doc 6.4). Everything the user could change is
 * checked against the signature: material lines and links can only be removed, attachments must
 * be files that were analyzed, and the verdict and attributes come from the server.
 */
export async function POST(req: NextRequest) {
  const token = getAccessToken(req);
  if (!token) return signInRequired();

  const form = await req.formData();
  const share = parseJson<{ payload?: unknown; signature?: unknown }>(form.get("share"));
  const payload = readSignedShare(share);
  if (!payload || !share) return errorResponse("Hasil telaah ini tidak bisa dipakai untuk membuat post.", 400);

  const attributes = parseJson<DraftAttributes>(form.get("attributes"));
  const attributesSignature = form.get("attributesSignature");
  if (!attributes || typeof attributesSignature !== "string" || !hasValidAttributes(share.signature as string, attributes, attributesSignature)) {
    return errorResponse("Data post tidak valid. Muat ulang halaman lalu coba lagi.", 400);
  }

  const edits = parseJson<PostEdits>(form.get("edits")) ?? {};
  const title = typeof edits.title === "string" ? edits.title.trim() : "";
  const materialLines = isStringArray(edits.materialLines) ? edits.materialLines : [];
  const links = isStringArray(edits.links) ? edits.links : [];
  const story = typeof edits.story === "string" ? redactSensitive(edits.story.trim()).slice(0, MAX_STORY_LENGTH) : "";

  if (!title || title.length > MAX_TITLE_LENGTH) return errorResponse("Judul wajib diisi, maksimal 120 karakter.", 422);
  if (!materialLines.length || !isSubsequence(materialLines, payload.materialLines)) {
    return errorResponse("Materi lowongan hanya boleh dikurangi.", 422);
  }
  if (!links.every((link) => payload.links.includes(link))) return errorResponse("Link hanya boleh dikurangi.", 422);

  // Attachments must be byte-identical to an analyzed image (re-uploads included, design doc 6.5)
  const laravelForm = new FormData();
  const attachments: Array<{ label: string; sha256: string }> = [];
  for (const entry of form.getAll("files")) {
    if (!(entry instanceof File)) continue;
    const sha256 = sha256OfBytes(new Uint8Array(await entry.arrayBuffer()));
    const analyzed = payload.attachments.find((item) => item.sha256 === sha256);
    if (!analyzed) {
      return errorResponse(`"${entry.name}" bukan file yang ditelaah. Unggah ulang file yang sama persis.`, 422);
    }
    if (attachments.some((item) => item.sha256 === sha256)) continue;
    attachments.push({ label: analyzed.label, sha256 });
    laravelForm.append("files[]", entry, entry.name);
  }

  // Contacts are re-read from the kept lines, so a removed line takes its number off the post too.
  const keptText = materialLines.join("\n");
  const { contacts, identifiers } = findContacts(keptText);
  const sourcePlatform = typeof edits.sourcePlatform === "string" && SOURCE_PLATFORMS.includes(edits.sourcePlatform)
    ? edits.sourcePlatform
    : null;
  const sourceAccount = typeof edits.sourceAccount === "string" ? edits.sourceAccount.trim().slice(0, 255) || null : null;

  laravelForm.append(
    "post",
    JSON.stringify({
      title,
      story: story || null,
      risk_level: payload.riskLevel,
      claim: payload.claim,
      summary: payload.summary,
      modus: attributes.modus,
      evidence: payload.evidence,
      material_lines: materialLines,
      links,
      contacts,
      identifiers,
      company: attributes.company,
      position: attributes.position,
      location: attributes.location,
      salary: attributes.salary,
      open_date: attributes.openDate,
      close_date: attributes.closeDate,
      source_platform: sourcePlatform,
      source_account: sourceAccount,
      analyzed_at: payload.analyzedAt,
      attachments,
      embedding: await embedText(embeddingTextFor(materialLines)),
    })
  );

  try {
    const response = await backendFetch("/telaah-bersama", {
      method: "POST",
      token,
      headers: internalKeyHeader(),
      body: laravelForm,
    });
    return relay(response);
  } catch (error) {
    return backendUnavailable(error);
  }
}
