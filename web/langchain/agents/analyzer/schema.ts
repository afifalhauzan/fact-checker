import { z } from "zod";

export const RiskTypeSchema = z.enum(["bias", "overclaim", "missing_context"]);

export const ClaimSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
});

export const RiskSchema = z.object({
  type: RiskTypeSchema,
  description: z.string(),
});

export const SourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string().url(),
});

export const ReasoningSchema = z.object({
  intent: z.string(),
  steps: z.array(z.string()),
});

export const ReferenceSchema = z.object({
  title: z.string(),
  snippet: z.string().optional(),
  url: z.string().url().optional(),
});

export const AnalysisSchema = z.object({
  conversationText: z.string(),
  claims: z.array(ClaimSchema),
  risks: z.array(RiskSchema),
  summary: z.string(),
  explanation: z.string().optional(),
  suggestedQuestions: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).default([]),
  reasoning: z.array(ReasoningSchema).optional(),
  references: z.array(ReferenceSchema).default([]),
});

export type Claim = z.infer<typeof ClaimSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Reasoning = z.infer<typeof ReasoningSchema>;
export type Reference = z.infer<typeof ReferenceSchema>;
export type AnalysisResult = z.infer<typeof AnalysisSchema>;
