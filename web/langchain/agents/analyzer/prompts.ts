import { PromptTemplate } from "@langchain/core/prompts";

export const analyzerSystemPrompt = `You are an analysis assistant.
Return concise, evidence-focused assessments from user input.
Always prefer explicit uncertainty over fabricated certainty.`;

export const analyzerInputPrompt = PromptTemplate.fromTemplate(
  [
    "Analyze the following input and return structured analysis:",
    "{input}",
  ].join("\n\n")
);
