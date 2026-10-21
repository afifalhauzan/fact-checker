import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { AnalyzeImage } from "../analyzer/analyze";
import { composeMaterialText } from "../analyzer/extraction";
import { redactSensitive } from "../analyzer/redaction";
import type { AnalysisResult, Risk, RiskType } from "../analyzer/schema";
import { findContacts, findLinks, type Identifier } from "./identifiers";

// The analysis result lives in client-held chat history, so it cannot be trusted for public
// content. Instead the server signs what a post may contain (design doc 6.4); publishing later
// checks the signature, and the user can only remove from it.

const MAX_LINES = 200;
const MAX_LINE_LENGTH = 1_000;
const MAX_LINKS = 20;
// Laravel stores images only; PDFs that were analyzed are not attached to posts.
const PUBLISHABLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const ATTACHMENT_LABELS: Record<string, string> = {
  poster_lowongan: "Poster lowongan",
  screenshot_chat: "Screenshot chat",
  surat_dokumen: "Surat atau dokumen",
  postingan_medsos: "Postingan media sosial",
};

export interface ShareAttachment {
  sha256: string;
  label: string;
  mediaType: string;
}

export interface SharePayload {
  v: 1;
  riskLevel: "sedang" | "tinggi";
  claim: string;
  summary: string;
  evidence: Risk[];
  riskTypes: RiskType[];
  materialLines: string[];
  links: string[];
  contacts: Identifier[];
  identifiers: Identifier[];
  attachments: ShareAttachment[];
  company?: string;
  analyzedAt: string;
}

/** Sent to the client as the data-telaah-share part: the exact signed string plus its signature. */
export interface SignedShare {
  payload: string;
  signature: string;
}

function signingKey(): string {
  const key = process.env.TELAAH_SIGNING_KEY || (process.env.NODE_ENV !== "production" ? "dev-telaah-signing-key" : "");
  if (!key) throw new Error("TELAAH_SIGNING_KEY is not set");
  return key;
}

export function sign(text: string): string {
  return createHmac("sha256", signingKey()).update(text).digest("hex");
}

export function hasValidSignature(text: string, signature: string): boolean {
  const expected = Buffer.from(sign(text), "hex");
  const given = Buffer.from(signature, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Identifies one signed analysis, so it can be published only once. */
export function shareKeyOf(signature: string): string {
  return createHash("sha256").update(signature).digest("hex");
}

export function sha256OfDataUrl(url: string): string | null {
  const match = /^data:[^;,]+;base64,([\s\S]*)$/.exec(url);
  return match ? createHash("sha256").update(Buffer.from(match[1], "base64")).digest("hex") : null;
}

export function sha256OfBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Material split into lines, with the applicant's NIK and one-time codes masked. */
export function toMaterialLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => redactSensitive(line).slice(0, MAX_LINE_LENGTH))
    .slice(0, MAX_LINES);
}

/** Null unless the analysis reached a Sedang or Tinggi verdict: only those can become posts (design doc 5.1). */
export function buildSharePayload({
  analysis,
  userText,
  attachments,
  now = new Date(),
}: {
  analysis: AnalysisResult;
  userText: string;
  attachments: AnalyzeImage[];
  now?: Date;
}): SharePayload | null {
  const claim = analysis.claims[0];
  if (!claim || (claim.riskLevel !== "sedang" && claim.riskLevel !== "tinggi")) return null;

  const materialText = composeMaterialText(userText, analysis.material?.transcript);
  const { contacts, identifiers } = findContacts(materialText);
  const kinds = analysis.material?.attachments ?? [];

  const shareAttachments: ShareAttachment[] = [];
  attachments.forEach((attachment, index) => {
    const sha256 = PUBLISHABLE_IMAGE_TYPES.has(attachment.mediaType) ? sha256OfDataUrl(attachment.url) : null;
    if (sha256) {
      shareAttachments.push({
        sha256,
        label: ATTACHMENT_LABELS[kinds[index]?.kind ?? ""] ?? "Lampiran",
        mediaType: attachment.mediaType,
      });
    }
  });

  return {
    v: 1,
    riskLevel: claim.riskLevel,
    claim: claim.text,
    summary: analysis.summary,
    evidence: analysis.risks,
    riskTypes: [...new Set(analysis.risks.map((risk) => risk.type))],
    materialLines: toMaterialLines(materialText),
    links: findLinks(materialText).slice(0, MAX_LINKS),
    contacts,
    identifiers,
    attachments: shareAttachments,
    company: analysis.material?.entities?.companyNames?.[0],
    analyzedAt: now.toISOString(),
  };
}

export function signSharePayload(payload: SharePayload): SignedShare {
  const text = JSON.stringify(payload);
  return { payload: text, signature: sign(text) };
}

/** The payload, or null when the signature does not match or it is not a postable verdict. */
export function readSignedShare(share: { payload?: unknown; signature?: unknown } | null | undefined): SharePayload | null {
  if (typeof share?.payload !== "string" || typeof share.signature !== "string") return null;
  if (!hasValidSignature(share.payload, share.signature)) return null;

  try {
    const payload = JSON.parse(share.payload) as SharePayload;
    return payload.v === 1 && (payload.riskLevel === "sedang" || payload.riskLevel === "tinggi") ? payload : null;
  } catch {
    return null;
  }
}

/** True when `kept` is `original` with some lines removed and none added or changed. */
export function isSubsequence(kept: string[], original: string[]): boolean {
  let index = 0;
  for (const line of original) {
    if (index < kept.length && kept[index] === line) index += 1;
  }
  return index === kept.length;
}
