import { AnalysisSchema, type AnalysisResult, type Reference } from "./schema";
import type { AnalyzeImage } from "./analyze";
import { composeMaterialText, isSupportedAttachment } from "./extraction";
import type { SearchSource } from "./tools/tavily-search";

/** Minimal view of the AI SDK UI messages the client sends. Every field is untrusted input. */
export interface LooseMessagePart {
  type?: string;
  text?: string;
  mediaType?: string;
  url?: string;
  data?: unknown;
}

export interface LooseMessage {
  id?: string;
  role?: string;
  parts?: LooseMessagePart[];
}

/** The posting under discussion: the latest analysis that reached a verdict, plus its source message. */
export interface PostingContext {
  postingText: string;
  // All material of this posting sent so far (earlier stages included), without the link
  // evidence; a later stage of the same posting is analyzed together with it.
  material: string;
  images: AnalyzeImage[];
  analysis: Partial<AnalysisResult>;
  // Index of the assistant message that holds the analysis.
  analysisIndex: number;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  text: string;
}

const MAX_TURN_LENGTH = 400;

export function toMessageList(messages: unknown): LooseMessage[] {
  return Array.isArray(messages) ? messages : [];
}

function partsOf(message: LooseMessage | undefined): LooseMessagePart[] {
  return Array.isArray(message?.parts) ? message.parts : [];
}

function textOf(message: LooseMessage | undefined): string {
  return partsOf(message)
    .filter((part) => part.type === "text")
    .map((part) => String(part.text ?? ""))
    .join("\n")
    .trim();
}

function imagesOf(message: LooseMessage | undefined): AnalyzeImage[] {
  return partsOf(message)
    .filter(
      (part) =>
        part.type === "file" &&
        typeof part.mediaType === "string" &&
        isSupportedAttachment(part.mediaType) &&
        typeof part.url === "string" &&
        part.url.length > 0
    )
    .map((part) => ({ mediaType: part.mediaType as string, url: part.url as string }));
}

function parseAnalysis(data: unknown): Partial<AnalysisResult> | null {
  try {
    const value = typeof data === "string" ? JSON.parse(data) : data;
    if (!value || typeof value !== "object") {
      return null;
    }
    const parsed = AnalysisSchema.safeParse(value);
    return parsed.success ? parsed.data : (value as Partial<AnalysisResult>);
  } catch {
    return null;
  }
}

/**
 * A TelaahBareng post offered as "sudah ditelaah sebelumnya" becomes the posting under discussion
 * for follow-up questions (design doc decision 11). It is labeled as someone else's earlier
 * analysis and never reaches runAnalysis.
 */
function similarTelaahAsAnalysis(message: LooseMessage): Partial<AnalysisResult> | null {
  const data = partsOf(message).find((part) => part.type === "data-similar-telaah")?.data as
    | { post?: { id?: number; claim?: string; riskLevel?: string; summary?: string; evidence?: AnalysisResult["risks"]; analyzedAt?: string } }
    | undefined;
  const post = data?.post;
  if (!post?.claim || (post.riskLevel !== "sedang" && post.riskLevel !== "tinggi")) {
    return null;
  }

  return {
    claims: [{ text: post.claim, confidence: 0, riskLevel: post.riskLevel }],
    summary: `Dari Telaah #${post.id} di TelaahBareng, dibagikan pengguna lain dan dinilai pada ${post.analyzedAt?.slice(0, 10) ?? "tanggal tidak diketahui"}. ${post.summary ?? ""}`.trim(),
    risks: Array.isArray(post.evidence) ? post.evidence : [],
  };
}

/**
 * Walks back from `fromIndex` to the nearest analysis that reached a verdict and returns it with
 * the user message (text + images) that produced it. Analyses without a verdict (greetings,
 * questions) are skipped: there is no posting to discuss in them.
 */
export function findPostingContext(messages: LooseMessage[], fromIndex: number): PostingContext | null {
  for (let i = Math.min(fromIndex, messages.length - 1); i >= 0; i -= 1) {
    if (messages[i]?.role !== "assistant") {
      continue;
    }
    const analysisPart = partsOf(messages[i]).find((part) => part.type === "data-analysis");
    const analysis = analysisPart ? parseAnalysis(analysisPart.data) : (similarTelaahAsAnalysis(messages[i]) ?? null);
    if (!analysis?.claims?.length) {
      continue;
    }

    for (let j = i - 1; j >= 0; j -= 1) {
      if (messages[j]?.role !== "user") {
        continue;
      }

      // Attachments were already transcribed during the analysis: reuse that text and only send
      // the originals to the model again when the transcript is known to be incomplete.
      const transcript = analysis.material?.transcript;
      const ownMaterial = transcript?.trim() ? composeMaterialText(textOf(messages[j]), transcript) : textOf(messages[j]);
      const material = [analysis.material?.earlierMaterial, ownMaterial].filter(Boolean).join("\n\n");
      return {
        // Shortlink destinations and the linked page were also read once, during the analysis
        postingText: [material, analysis.material?.linkEvidence].filter(Boolean).join("\n\n"),
        material,
        images: !transcript?.trim() || analysis.material?.legibility === "sebagian" ? imagesOf(messages[j]) : [],
        analysis,
        analysisIndex: i,
      };
    }
    return { postingText: "", material: "", images: [], analysis, analysisIndex: i };
  }

  return null;
}

/** Text of the turns in [fromIndex, beforeIndex), keeping the most recent `maxTurns`. */
export function recentTurns(
  messages: LooseMessage[],
  fromIndex: number,
  beforeIndex: number,
  maxTurns: number
): ConversationTurn[] {
  const turns: ConversationTurn[] = [];

  for (let i = Math.max(0, fromIndex); i < Math.min(beforeIndex, messages.length); i += 1) {
    const message = messages[i];
    if (message?.role !== "user" && message?.role !== "assistant") {
      continue;
    }

    let text = textOf(message);
    // Action answers carry their substance in the insight card, not in the text parts.
    const insight = partsOf(message).find((part) => part.type === "data-action-insight")?.data as
      | { title?: string; points?: string[] }
      | undefined;
    if (insight?.points?.length) {
      text = `${text}\n${insight.title ?? ""}: ${insight.points.join(" | ")}`.trim();
    }

    if (text) {
      turns.push({
        role: message.role,
        text: text.length > MAX_TURN_LENGTH ? `${text.slice(0, MAX_TURN_LENGTH)}…` : text,
      });
    }
  }

  return turns.slice(-maxTurns);
}

export function formatAnalysisContext(analysis: Partial<AnalysisResult> | null): string {
  if (!analysis) {
    return "";
  }

  const lines: string[] = [];
  const claim = analysis.claims?.[0];
  if (claim?.text) {
    lines.push(`Tingkat risiko: ${claim.text}`);
  }
  if (analysis.summary) {
    lines.push(`Ringkasan: ${analysis.summary}`);
  }
  if (analysis.risks?.length) {
    lines.push("Risiko yang ditemukan:");
    for (const risk of analysis.risks) {
      lines.push(`- ${risk.type}: ${risk.description}${risk.evidence ? ` (bukti: "${risk.evidence}")` : ""}`);
    }
  }
  if (analysis.salaryBenefit) {
    lines.push(`Gaji & benefit: ${analysis.salaryBenefit.status}. ${analysis.salaryBenefit.summary}`);
  }
  return lines.join("\n");
}

/**
 * The web sources behind an analysis. Only references that came from search carry a citation;
 * they keep their order, so S1..Sn here match the [1]..[n] labels the user already saw.
 */
export function contextSources(analysis: Partial<AnalysisResult> | null): {
  references: Reference[];
  sources: SearchSource[];
} {
  const references = (analysis?.references ?? []).filter((reference) => reference.url && reference.citations?.length);
  return {
    references,
    sources: references.map((reference, index) => ({
      id: `S${index + 1}`,
      title: reference.title,
      url: reference.url as string,
      snippet: reference.snippet ?? "",
    })),
  };
}
