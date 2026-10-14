import { getLLMModel, LLM_TIMEOUT_MS } from "./llm";
import { ACTION_TITLES, actionSystemPrompt, buildActionUserPrompt, withCurrentDate } from "./prompts";
import {
  LLMActionOutputSchema,
  type AnalysisResult,
  type Reference,
  type SalaryBenefitAssessment,
} from "./schema";
import type { AnalyzeImage } from "./analyze";
import { contextSources, findPostingContext, formatAnalysisContext, toMessageList } from "./conversation-context";
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

/**
 * Recovers what the action should look at from the chat history the client already sends:
 * the analysis the chip belongs to and the user message (text + images) that produced it.
 */
function resolveActionContext(messages: unknown, payload: UIActionPayload): ActionContext {
  const list = toMessageList(messages);

  let sourceIndex = payload.sourceMessageId ? list.findIndex((message) => message?.id === payload.sourceMessageId) : -1;
  if (sourceIndex < 0) {
    sourceIndex = list.length - 1;
  }

  // No analysis in the history (e.g. older client): fall back to the context the client sent.
  return (
    findPostingContext(list, sourceIndex) ?? { postingText: payload.context ?? payload.claim ?? "", images: [], analysis: null }
  );
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
  const { references: searchReferences, sources } = contextSources(context.analysis);
  const previousSalaryBenefit = isSalaryAction ? context.analysis?.salaryBenefit : undefined;

  try {
    const llm = getLLMModel({ temperature: 0.2, stage: "action" });
    const structuredLlm = llm.withStructuredOutput(LLMActionOutputSchema, { includeRaw: true });

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
        { role: "system", content: withCurrentDate(actionSystemPrompt) },
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
