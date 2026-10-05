import { getLLMModel, LLM_TIMEOUT_MS } from "./llm";
import { ACTION_TITLES, actionSystemPrompt, buildActionUserPrompt } from "./prompts";
import {
  AnalysisSchema,
  LLMActionOutputSchema,
  type AnalysisResult,
  type Reference,
  type SalaryBenefitAssessment,
} from "./schema";
import type { AnalyzeImage } from "./analyze";
import type { SearchSource } from "./tools/tavily-search";
import type { UIActionId, UIActionPayload } from "@/types/ui-actions";

export interface UIActionResult {
  openingText: string;
  title: string;
  points: string[];
  closingText: string;
  references?: Reference[];
  salaryBenefit?: SalaryBenefitAssessment;
}

interface ActionContext {
  postingText: string;
  images: AnalyzeImage[];
  analysis: Partial<AnalysisResult> | null;
}

interface LooseMessagePart {
  type?: string;
  text?: string;
  mediaType?: string;
  url?: string;
  data?: unknown;
}

interface LooseMessage {
  id?: string;
  role?: string;
  parts?: LooseMessagePart[];
}

const CLOSING_TEXT = "Jika ada aspek lain yang ingin kamu cek, pilih tombol aksi lainnya di bawah.";
const SALARY_BENEFIT_TITLE = "Kewajaran Gaji & Benefit";
const MIN_POINTS = 2;
const MAX_POINTS = 5;

// Used only when the model cannot run; general but still specific to the chosen action.
const FALLBACK_POINTS: Record<UIActionId, string[]> = {
  validate_company: [
    "Cari website resmi perusahaan dan pastikan lowongan yang sama tercantum di halaman kariernya.",
    "Cocokkan nama perusahaan dan riwayat rekrutmennya di akun LinkedIn resmi.",
    "Untuk badan usaha berbentuk PT, cek legalitasnya melalui AHU Online (ahu.go.id).",
    "Periksa alamat kantor di peta digital dan pastikan alamatnya nyata.",
  ],
  check_red_flags: [
    "Permintaan biaya dalam bentuk apa pun (pendaftaran, pelatihan, seragam, tes kesehatan) adalah tanda bahaya utama.",
    "Permintaan data sensitif seperti OTP, PIN, atau foto KTP sambil selfie patut dicurigai.",
    "Proses yang hanya lewat chat pribadi tanpa email domain resmi perlu diverifikasi.",
    "Gaji tinggi dengan syarat sangat ringan atau desakan untuk segera mendaftar perlu diwaspadai.",
  ],
  check_link_contact: [
    "Recruiter resmi biasanya memakai email berdomain perusahaan, bukan @gmail atau @yahoo.",
    "Hindari membuka shortlink (bit.ly, s.id) tanpa tahu tujuan aslinya.",
    "Kontak yang hanya lewat WhatsApp atau Telegram pribadi perlu dikonfirmasi ke nomor resmi perusahaan.",
    "Jangan login atau mengisi data pribadi di tautan yang domainnya berbeda dari website resmi perusahaan.",
  ],
  check_salary_benefit_reasonableness: [
    "Bandingkan gaji dengan lowongan posisi sejenis di portal kerja resmi.",
    "Gaji yang jauh di atas rata-rata untuk syarat yang sangat ringan perlu diwaspadai.",
    "Pastikan rincian gaji dan benefit tertulis di kontrak kerja resmi.",
    "Pekerjaan yang sah tidak mensyaratkan pembayaran atau deposit di awal.",
  ],
  safe_next_steps: [
    "Jangan membayar biaya apa pun sebelum lowongan terverifikasi di kanal resmi perusahaan.",
    "Jangan mengirim OTP, PIN, kata sandi, atau foto KTP sambil selfie kepada siapa pun.",
    "Hubungi perusahaan lewat kontak di website resminya untuk memastikan lowongan ini benar.",
    "Simpan bukti percakapan dan laporkan lowongan mencurigakan ke platform tempat kamu menemukannya.",
  ],
};

function partsOf(message: LooseMessage | undefined): LooseMessagePart[] {
  return Array.isArray(message?.parts) ? message.parts : [];
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
 * Recovers what the action should look at from the chat history the client already sends:
 * the analysis the chip belongs to and the user message (text + images) that produced it.
 */
export function resolveActionContext(messages: unknown, payload: UIActionPayload): ActionContext {
  const list: LooseMessage[] = Array.isArray(messages) ? messages : [];

  let sourceIndex = payload.sourceMessageId ? list.findIndex((message) => message?.id === payload.sourceMessageId) : -1;
  if (sourceIndex < 0) {
    sourceIndex = list.length - 1;
  }

  for (let i = sourceIndex; i >= 0; i -= 1) {
    if (list[i]?.role !== "assistant") {
      continue;
    }
    const analysisPart = partsOf(list[i]).find((part) => part.type === "data-analysis");
    if (!analysisPart) {
      continue;
    }

    const analysis = parseAnalysis(analysisPart.data);
    for (let j = i - 1; j >= 0; j -= 1) {
      if (list[j]?.role !== "user") {
        continue;
      }
      const parts = partsOf(list[j]);
      return {
        postingText: parts
          .filter((part) => part.type === "text")
          .map((part) => String(part.text ?? ""))
          .join("\n")
          .trim(),
        images: parts
          .filter(
            (part) =>
              part.type === "file" &&
              typeof part.mediaType === "string" &&
              part.mediaType.startsWith("image/") &&
              typeof part.url === "string" &&
              part.url.length > 0
          )
          .map((part) => ({ mediaType: part.mediaType as string, url: part.url as string })),
        analysis,
      };
    }
    return { postingText: "", images: [], analysis };
  }

  // No analysis in the history (e.g. older client): fall back to the context the client sent.
  return { postingText: payload.context ?? payload.claim ?? "", images: [], analysis: null };
}

function formatAnalysisContext(analysis: Partial<AnalysisResult> | null): string {
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
  return lines.join("\n");
}

// Only references that came from web search (they carry a citation) count as evidence.
function searchReferencesOf(analysis: Partial<AnalysisResult> | null): Reference[] {
  return (analysis?.references ?? []).filter((reference) => reference.url && reference.citations?.length);
}

function cleanPoints(points: string[] | undefined): string[] {
  return (points ?? [])
    .map((point) => point.replace(/^\s*(?:\d+[.)]|[-•*])\s+/, "").trim())
    .filter((point) => point.length > 5)
    .slice(0, MAX_POINTS);
}

export async function handleUIAction(payload: UIActionPayload, messages: unknown): Promise<UIActionResult> {
  const actionId = payload.actionId;
  const title = ACTION_TITLES[actionId];
  const isSalaryAction = actionId === "check_salary_benefit_reasonableness";

  const context = resolveActionContext(messages, payload);
  const searchReferences = searchReferencesOf(context.analysis);
  const previousSalaryBenefit = isSalaryAction ? context.analysis?.salaryBenefit : undefined;

  try {
    const llm = getLLMModel({ temperature: 0.2 });
    const structuredLlm = llm.withStructuredOutput(LLMActionOutputSchema, { includeRaw: true });

    const sources: SearchSource[] = searchReferences.map((reference, index) => ({
      id: `S${index + 1}`,
      title: reference.title,
      url: reference.url as string,
      snippet: reference.snippet ?? "",
    }));

    const prompt = buildActionUserPrompt({
      actionId,
      postingText: context.postingText,
      imageCount: context.images.length,
      analysisContext: formatAnalysisContext(context.analysis),
      sources,
    });

    const userContent = context.images.length
      ? [{ type: "text", text: prompt }, ...context.images.map((image) => ({ type: "image_url", image_url: image.url }))]
      : prompt;

    const { parsed } = await structuredLlm.invoke(
      [
        { role: "system", content: actionSystemPrompt },
        { role: "user", content: userContent },
      ],
      { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) }
    );

    if (!parsed) {
      throw new Error("Model output did not match LLMActionOutputSchema");
    }

    const points = cleanPoints(parsed.points);
    const salaryBenefit = isSalaryAction
      ? parsed.salaryBenefit
        ? { title: SALARY_BENEFIT_TITLE, ...parsed.salaryBenefit }
        : previousSalaryBenefit
      : undefined;

    return {
      openingText: parsed.openingText?.trim() || `Siap, ini hasil pendalaman untuk **${title}**:`,
      title,
      points: points.length >= MIN_POINTS ? points : FALLBACK_POINTS[actionId],
      closingText: CLOSING_TEXT,
      references: searchReferences.length ? searchReferences : undefined,
      salaryBenefit,
    };
  } catch (error) {
    console.error("[ActionHandler] Model action failed, using static guidance:", error instanceof Error ? error.message : error);
    return {
      openingText: "Analisis AI untuk aksi ini sedang tidak dapat dijalankan. Berikut panduan umum yang tetap bisa kamu lakukan:",
      title,
      points: FALLBACK_POINTS[actionId],
      closingText: CLOSING_TEXT,
      salaryBenefit: previousSalaryBenefit,
    };
  }
}
