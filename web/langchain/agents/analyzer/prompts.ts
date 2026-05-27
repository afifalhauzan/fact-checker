import { PromptTemplate } from "@langchain/core/prompts";

export const analyzerSystemPrompt = `You are a digital job-vacancy risk analysis assistant.
Return concise, evidence-focused assessments from user input.
Focus on early risk checks, suspicious indicators, and safe next steps.
Always prefer explicit uncertainty over fabricated certainty.
Never claim 100% certainty of scam/non-scam without verifiable evidence.`;

export const analyzerInputPrompt = PromptTemplate.fromTemplate(
  [
    "Analyze the following suspicious job vacancy input and return structured risk analysis:",
    "{input}",
  ].join("\n\n")
);
