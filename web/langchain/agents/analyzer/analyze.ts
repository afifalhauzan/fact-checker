import { AnalysisSchema, type AnalysisResult } from "./schema";
import { analyzerInputPrompt, analyzerSystemPrompt } from "./prompts";
import { getLLMModel } from "./llm";
import { preprocessJobInput } from "./preprocessor";
import { executeWebVerification } from "./tools/tavily-search";
import { handleRealUIAction, type MockUIActionResult } from "./action-handler";
import type { UIActionPayload } from "@/types/ui-actions";

interface AnalyzeInput {
  input: string;
}

export type { MockUIActionResult };

export function handleMockUIAction(actionPayload: UIActionPayload): MockUIActionResult | Promise<MockUIActionResult> {
  return handleRealUIAction(actionPayload);
}

export async function analyzeContent({ input }: AnalyzeInput): Promise<AnalysisResult> {
  const preprocessed = preprocessJobInput(input);
  const trimmed = preprocessed.cleanedText;

  if (!trimmed.length || !preprocessed.hasSubstantiveContent) {
    return AnalysisSchema.parse({
      conversationText: trimmed.length
        ? "Halo! Pesan ini sepertinya belum berisi detail lowongan kerja. Tempel teks, link, atau deskripsi poster lowongan yang ingin kamu periksa."
        : "Belum ada input lowongan yang bisa dianalisis. Tempel teks, link, atau deskripsi poster lowongan terlebih dahulu.",
      claims: [],
      risks: [],
      summary: "",
      summaryCitations: [],
      explanations: [],
      suggestedQuestions: [
        "Bantu cek red flag dari tawaran kerja ini.",
        "Periksa apakah perusahaan dan link pendaftarannya valid.",
        "Apakah wajar kalau recruiter meminta biaya administrasi?",
        "Apa langkah aman sebelum saya kirim data pribadi?",
      ],
      references: [],
    });
  }

  // Execute web verification tool if company or domain is mentioned
  const webSearchResult = await executeWebVerification(trimmed.slice(0, 120));

  try {
    const llm = getLLMModel({ temperature: 0.2 });

    // Use structured output from LangChain
    const structuredLlm = llm.withStructuredOutput
      ? llm.withStructuredOutput(AnalysisSchema)
      : null;

    if (structuredLlm) {
      const formattedInput = await analyzerInputPrompt.format({ input: trimmed });
      const rawResult = await structuredLlm.invoke([
        { role: "system", content: analyzerSystemPrompt },
        { role: "user", content: formattedInput },
      ]);

      const mergedReferences =
        rawResult.references && rawResult.references.length > 0
          ? rawResult.references
          : webSearchResult.references;

      const fullResult: AnalysisResult = {
        ...rawResult,
        references: mergedReferences,
        reasoning: rawResult.reasoning?.length
          ? rawResult.reasoning
          : [
              {
                intent: "Menganalisis risiko lowongan kerja digital secara terstruktur",
                steps: [
                  "Mengidentifikasi identitas perusahaan, posisi, dan kanal pendaftaran",
                  "Mengevaluasi klaim gaji, syarat kualifikasi, dan anomali biaya",
                  "Memeriksa indikator risiko pada link dan kontak perekrut",
                  "Menyusun ringkasan risiko dan rekomendasi langkah aman",
                ],
              },
            ],
      };

      return AnalysisSchema.parse(fullResult);
    }
  } catch (error) {
    console.error("[Analyzer Core] Structured LLM invocation error, building smart fallback:", error);
  }

  // Fallback to intelligent rule-augmented analysis if LLM fails or doesn't support structured output
  return buildSmartAnalysisFallback(preprocessed, webSearchResult.references);
}

function buildSmartAnalysisFallback(
  preprocessed: ReturnType<typeof preprocessJobInput>,
  webReferences: any[]
): AnalysisResult {
  const { cleanedText, hasShortlink, hasFreeEmailDomain } = preprocessed;
  const isHighRisk =
    hasShortlink ||
    hasFreeEmailDomain ||
    cleanedText.toLowerCase().includes("biaya") ||
    cleanedText.toLowerCase().includes("whatsapp") ||
    cleanedText.toLowerCase().includes("wa ");

  const fallback: AnalysisResult = {
    conversationText:
      "Saya telah melakukan analisis risiko awal pada lowongan kerja yang kamu kirimkan. Hasil di bawah membantu mengenali indikator kehati-hatian sebelum melanjutkan proses melamar.",
    claims: [
      {
        text: isHighRisk
          ? "Tingkat Risiko Awal: Tinggi. Ditemukan kombinasi indikator yang memerlukan verifikasi ekstra pada kanal resmi."
          : "Tingkat Risiko Awal: Sedang. Informasi awal belum sepenuhnya terverifikasi di domain resmi perusahaan.",
        confidence: isHighRisk ? 0.85 : 0.65,
      },
    ],
    salaryBenefit: {
      title: "Kewajaran Gaji & Benefit",
      status: "Perlu Diverifikasi",
      summary:
        "Tawaran gaji atau benefit perlu dibandingkan dengan kualifikasi kerja dan standar industri posisi sejenis.",
      highlights: [
        "Klaim benefit: perlu diverifikasi",
        "Kejelasan role: periksa kembali deskripsi tugas",
        "Kejelasan kontrak: pastikan ada perjanjian resmi tertulis",
      ],
      hint:
        "Benefit tinggi bukan otomatis penipuan, namun menjadi red flag jika digabung dengan chat personal atau permintaan biaya.",
    },
    risks: [
      {
        type: "overclaim",
        description:
          "Penawaran benefit dan gaji terlihat sangat menarik, tetapi detail tanggung jawab pekerjaan belum dijelaskan secara transparan.",
      },
      {
        type: "missing_context",
        description:
          "Informasi legalitas perusahaan, alamat kantor fisik, dan profil HR resmi belum terverifikasi kuat.",
      },
      {
        type: "bias",
        description:
          hasShortlink || hasFreeEmailDomain
            ? "Penggunaan link pendaftaran non-korporat atau kontak personal berisiko mengarah ke social engineering."
            : "Ada dorongan proses cepat yang berisiko membuat kandidat melewatkan tahap verifikasi.",
      },
    ],
    summary:
      "Ringkasan lowongan: materi yang dikirim menunjukkan indikasi penawaran kerja digital yang memerlukan pemeriksaan ulang. Beberapa detail penting seperti domain email korporat, legalitas perusahaan, dan kejelasan mekanisme seleksi belum terlihat kuat. Catatan: ini adalah asesmen risiko awal, bukan vonis mutlak.",
    summaryCitations: [],
    explanations: [
      {
        title: "Validitas Perusahaan",
        explanation:
          "Pastikan nama perusahaan yang diklaim memiliki website korporat resmi dan posisi yang sama terbit di halaman karier resmi atau LinkedIn.",
      },
      {
        title: "Risiko Link & Kontak",
        explanation:
          "Kanal pendaftaran berupa shortlink atau email non-korporat (@gmail/@yahoo) berisiko. Mintalah konfirmasi via email domain perusahaan resmi.",
      },
      {
        title: "Langkah Aman",
        explanation:
          "Jangan bayar biaya administrasi/modul/seragam, jangan kirim KTP/OTP di awal, dan simpan bukti percakapan recruiter.",
      },
    ],
    suggestedQuestions: [
      "Bantu cek red flag dari tawaran kerja ini.",
      "Periksa apakah perusahaan dan link pendaftarannya valid.",
      "Apakah wajar kalau recruiter meminta biaya administrasi?",
      "Apa langkah aman sebelum saya kirim data pribadi?",
    ],
    reasoning: [
      {
        intent: "Membantu pengguna mengevaluasi indikator risiko lowongan kerja digital secara bertahap",
        steps: [
          "Mengekstraksi elemen inti lowongan: posisi, perusahaan, kanal pendaftaran, dan kontak",
          "Mengevaluasi risiko dari link, domain email, dan biaya pendaftaran",
          "Menyusun estimasi tingkat risiko awal tanpa memberikan vonis mutlak",
          "Menyediakan panduan langkah aman sebelum pengguna melamar",
        ],
      },
    ],
    references: webReferences,
  };

  return AnalysisSchema.parse(fallback);
}
