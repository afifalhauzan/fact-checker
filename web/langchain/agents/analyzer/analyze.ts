import { AnalysisSchema, type AnalysisResult } from "./schema";
import { analyzerInputPrompt, analyzerSystemPrompt } from "./prompts";

interface AnalyzeInput {
  input: string;
}

function scoreConfidence(text: string): number {
  const lengthFactor = Math.min(text.length / 160, 1);
  return Number((0.55 + lengthFactor * 0.35).toFixed(2));
}

export async function analyzeContent({ input }: AnalyzeInput): Promise<AnalysisResult> {
  // Keep a LangChain-ready prompt path now, while still returning mock data.
  await analyzerInputPrompt.format({ input: input || "" });
  void analyzerSystemPrompt;

  const trimmed = input.trim();

  const mockResult: AnalysisResult = {
    conversationText: trimmed
      ? `Berikut penjelasan untuk diabetes:`
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
            "There’s no information to evaluate, so any conclusion would be unreliable.",
        },
      ],

    summary: trimmed
      ? "Diabetes adalah penyakit kronis yang terjadi ketika tubuh tidak dapat memproduksi atau menggunakan insulin dengan efektif, yang menyebabkan kadar gula darah menjadi tinggi."
      : "We couldn’t find a clear idea to analyze. Try entering a statement or claim.",

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

    sources: [
      {
        id: "source-1",
        title: "Cara kerja diabetes?",
        link: "https://example.com/reports/transition-cost-daily-energy",
      },
      {
        id: "source-2",
        title: "Catatan riset: perbandingan pola pengaruh gula dan kopi.",
        link: "https://example.com/research/bottom-up-vs-top-down-influence",
      },
      {
        id: "source-3",
        title: "Dokumentasi pemantauan: gejala awal diabetes",
        link: "https://example.com/docs/system-monitoring/stuck-mode-indicators",
      },
    ],
    reasoning: trimmed ? [{
      intent: "Menganalisis klaim utama dan mengidentifikasi potensi konteks yang hilang",
      steps: [
        "Mengekstraksi pernyataan kunci dari masukan",
        "Evaluasi kejelasan informasi yang diberikan",
        "Cek untuk konteks yang mungkin hilang atau disederhanakan secara berlebihan",
      ],
    }] : undefined,
    references: trimmed ? [
      {
        title: "Medical Authority on Diabetes",
        snippet: "Diabetes is a chronic condition affecting blood glucose regulation. Multiple factors including genetics, lifestyle, and environment play significant roles.",
        url: "https://example.com/medical/diabetes-overview",
      },
      {
        title: "Recent Research on Metabolic Disorders",
        snippet: "Understanding the relationship between diet, exercise, and metabolic function is crucial for preventive health strategies.",
        url: "https://example.com/research/metabolic-studies",
      },
    ] : [],
  };

  return AnalysisSchema.parse(mockResult);
}