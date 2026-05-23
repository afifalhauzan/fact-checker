import { AnalysisSchema, type AnalysisResult } from "./schema";
import { analyzerInputPrompt, analyzerSystemPrompt } from "./prompts";
import type { UIActionPayload } from "@/types/ui-actions";
import type { Reference } from "./schema";

interface AnalyzeInput {
  input: string;
}

function scoreConfidence(text: string): number {
  const lengthFactor = Math.min(text.length / 160, 1);
  return Number((0.55 + lengthFactor * 0.35).toFixed(2));
}

export interface MockUIActionResult {
  openingText: string;
  title: string;
  points: string[];
  closingText: string;
  references?: Reference[];
}

export function handleMockUIAction(actionPayload: UIActionPayload): MockUIActionResult {
  switch (actionPayload.actionId) {
    case "inspect_source":
      return {
        openingText: "Saya akan memeriksa sumber dan asal informasi yang terkait dengan klaim ini.",
        title: "Pemeriksaan Sumber",
        points: [
          "Sumber awal berasal dari input yang diberikan pengguna.",
          "Informasi dari gambar atau teks awal belum otomatis berarti valid.",
          "Perlu dicocokkan dengan sumber resmi, tanggal publikasi, dan identitas penyelenggara atau penerbit.",
        ],
        closingText:
          "Langkah paling aman adalah membandingkan informasi ini dengan kanal resmi atau sumber primer.",
        references: [
          {
            title: "Panduan Verifikasi Informasi Publik",
            snippet: "Pastikan identitas penerbit, tanggal publikasi, dan dokumen primer sebelum menyimpulkan validitas.",
            url: "https://example.com/verification/public-info-checklist",
            citations: [
              {
                id: "inspect-source-citation-1",
                label: "[1]",
                title: "Panduan Verifikasi Informasi Publik",
                link: "https://example.com/verification/public-info-checklist",
              },
            ],
          },
        ],
      };

    case "expand_context":
      return {
        openingText: "Saya akan mencari konteks yang mungkin belum terlihat dari informasi awal.",
        title: "Konteks yang Perlu Dilengkapi",
        points: [
          "Siapa pihak resmi yang menerbitkan informasi ini?",
          "Apakah ada tautan resmi atau dokumen pendukung?",
          "Kapan informasi ini berlaku?",
          "Apakah ada syarat, biaya, atau batasan yang belum terlihat?",
        ],
        closingText: "Tanpa konteks ini, informasi sebaiknya belum langsung dianggap lengkap.",
      };

    case "challenge_claim":
      return {
        openingText:
          "Saya akan menguji klaim ini dengan mencari kemungkinan bantahan atau titik lemah informasinya.",
        title: "Uji Klaim",
        points: [
          "Klaim perlu diuji apakah berasal dari sumber resmi.",
          "Perlu diperiksa apakah gambar atau teks sudah dipotong dari konteks aslinya.",
          "Perlu dicek apakah ada informasi lama yang disebarkan ulang.",
          "Perlu dibedakan antara klaim utama, promosi, dan interpretasi pembaca.",
        ],
        closingText:
          "Tujuan dari tahap ini bukan langsung menyatakan salah, tetapi mencegah informasi diterima mentah-mentah.",
      };

    case "simplify_explanation":
      return {
        openingText: "Saya akan menyederhanakan analisis ini menjadi bahasa yang lebih mudah dipahami.",
        title: "Penjelasan Sederhana",
        points: [
          "Informasi ini belum bisa langsung dipercaya hanya dari satu gambar atau satu teks.",
          "Yang perlu dicek adalah siapa pembuatnya, apakah ada sumber resmi, dan apakah detailnya lengkap.",
          "Kalau sumbernya jelas dan bisa diverifikasi, risikonya lebih rendah.",
          "Kalau sumbernya tidak jelas, sebaiknya jangan langsung disebarkan.",
        ],
        closingText:
          "Intinya: pahami dulu sumber dan konteksnya sebelum percaya atau membagikan informasi.",
      };

    default:
      return {
        openingText: "Saya akan menjalankan aksi yang kamu pilih.",
        title: "Aksi Lanjutan",
        points: [
          "Aksi diterima oleh sistem.",
          "Alur ini masih mock dan siap diganti node LangGraph di tahap berikutnya.",
        ],
        closingText: "Silakan lanjutkan dengan aksi lain jika perlu.",
      };
  }
}

export async function analyzeContent({ input }: AnalyzeInput): Promise<AnalysisResult> {
  // Keep a LangChain-ready prompt path now, while still returning mock data.
  await analyzerInputPrompt.format({ input: input || "" });
  void analyzerSystemPrompt;

  const trimmed = input.trim();

  const mockResult: AnalysisResult = {
    conversationText: trimmed
      ? "Berikut penjelasan untuk diabetes:"
      : "No input provided for analysis.",
    claims: trimmed
      ? [
          {
            text: trimmed,
            confidence: scoreConfidence(trimmed),
          },
        ]
      : [
          {
            text: "No clear claim detected from the input.",
            confidence: 0.2,
          },
        ],

    risks: trimmed
      ? [
          {
            type: "missing_context",
            description:
              "This statement might be too simplified. Important context or supporting details could be missing.",
          },
        ]
      : [
          {
            type: "overclaim",
            description:
              "There is no information to evaluate, so any conclusion would be unreliable.",
          },
        ],

    summary: trimmed
      ? "Diabetes adalah penyakit kronis yang terjadi ketika tubuh tidak dapat memproduksi atau menggunakan insulin dengan efektif, yang menyebabkan kadar gula darah menjadi tinggi."
      : "We could not find a clear idea to analyze. Try entering a statement or claim.",

    summaryCitations: trimmed
      ? [
          {
            id: "summary-citation-1",
            label: "[1]",
            title: "Medical Authority on Diabetes",
            link: "https://example.com/medical/diabetes-overview",
          },
          {
            id: "summary-citation-2",
            label: "[2]",
            title: "Recent Research on Metabolic Disorders",
            link: "https://example.com/research/metabolic-studies",
          },
        ]
      : [],

    explanation: trimmed
      ? `Dari pertanyaan ini: "${trimmed}".
Diabetes adalah penyakit kronis yang terjadi ketika tubuh tidak dapat memproduksi atau menggunakan insulin dengan efektif, yang menyebabkan kadar gula darah menjadi tinggi.
Penting untuk memahami bahwa diabetes bukan hanya tentang kadar gula darah, tetapi juga melibatkan faktor genetik, gaya hidup, dan lingkungan.
Jika Anda memiliki pertanyaan lebih lanjut atau ingin mendalami aspek tertentu, jangan ragu untuk bertanya!`
      : "Try entering a specific statement so we can break it down and explore it together.",

    suggestedQuestions: [
      "Bagaimana cara kerja diabetes?",
      "Jelaskan lebih dalam tentang perbedaan pengaruh gula dan kopi.",
      "Apa saja gejala awal diabetes?",
    ],

    reasoning: trimmed
      ? [
          {
            intent: "Menganalisis klaim utama dan mengidentifikasi potensi konteks yang hilang",
            steps: [
              "Mengekstraksi pernyataan kunci dari masukan",
              "Evaluasi kejelasan informasi yang diberikan",
              "Cek untuk konteks yang mungkin hilang atau disederhanakan secara berlebihan",
            ],
          },
        ]
      : undefined,
    references: trimmed
      ? [
          {
            title: "Medical Authority on Diabetes",
            snippet:
              "Diabetes is a chronic condition affecting blood glucose regulation. Multiple factors including genetics, lifestyle, and environment play significant roles.",
            url: "https://example.com/medical/diabetes-overview",
            citations: [
              {
                id: "reference-citation-1",
                label: "[1]",
                title: "Medical Authority on Diabetes",
                link: "https://example.com/medical/diabetes-overview",
              },
            ],
          },
          {
            title: "Recent Research on Metabolic Disorders",
            snippet:
              "Understanding the relationship between diet, exercise, and metabolic function is crucial for preventive health strategies.",
            url: "https://example.com/research/metabolic-studies",
            citations: [
              {
                id: "reference-citation-2",
                label: "[2]",
                title: "Recent Research on Metabolic Disorders",
                link: "https://example.com/research/metabolic-studies",
              },
            ],
          },
        ]
      : [],
  };

  return AnalysisSchema.parse(mockResult);
}
