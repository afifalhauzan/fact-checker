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
            text: "No explicit claim was provided.",
            confidence: 0.2,
          },
        ],
    risks: trimmed
      ? [
          {
            type: "missing_context",
            description: "The input may require additional background context for a robust conclusion.",
          },
        ]
      : [
          {
            type: "overclaim",
            description: "Empty input cannot support a factual conclusion.",
          },
        ],
    summary: trimmed
      ? "Initial structured analysis generated from user input."
      : "Structured analysis generated with fallback defaults due to empty input.",
  };

  return AnalysisSchema.parse(mockResult);
}
