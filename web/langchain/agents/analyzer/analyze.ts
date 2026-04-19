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
      ? "Here’s a quick breakdown of the main idea and what might need a closer look."
      : "We couldn’t find a clear idea to analyze. Try entering a statement or claim.",

    explanation: trimmed
      ? `This statement appears to make a general claim: "${trimmed}". 
It might sound convincing at first, but real-world issues are often more complex. 
Before accepting it, it's worth asking: what evidence supports this, and what might be missing?`
      : "Try entering a specific statement so we can break it down and explore it together.",

    suggestedQuestions: [
      "Bagaimana cara kerja Transition Cost dalam manajemen energi harian?",
      "Jelaskan lebih dalam tentang perbedaan Bottom-Up vs Top-Down influence.",
      "Apa saja indikator awal saat sistem masuk ke stuck_mode?",
    ],
  };

  return AnalysisSchema.parse(mockResult);
}