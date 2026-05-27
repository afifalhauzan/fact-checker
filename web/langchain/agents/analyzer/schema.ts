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

export const ReasoningSchema = z.object({
  intent: z.string(),
  steps: z.array(z.string()),
});

export const CitationSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  title: z.string(),
  link: z.string().url(),
});

export const ReferenceSchema = z.object({
  title: z.string(),
  snippet: z.string().optional(),
  url: z.string().url().optional(),
  citations: z.array(CitationSchema).default([]),
});

export const ExplanationItemSchema = z.object({
  title: z.string(),
  explanation: z.string(),
});

export const SalaryBenefitAssessmentSchema = z.object({
  title: z.string().default("Kewajaran Gaji & Benefit"),
  status: z.string().default("Perlu Diverifikasi"),
  summary: z.string(),
  highlights: z.array(z.string()).default([]),
  hint: z.string().optional(),
});

export const AnalysisSchema = z.object({
  conversationText: z.string(),
  claims: z.array(ClaimSchema),
  salaryBenefit: SalaryBenefitAssessmentSchema.optional(),
  risks: z.array(RiskSchema),
  summary: z.string(),
  summaryCitations: z.array(CitationSchema).default([]),
  explanations: z.array(ExplanationItemSchema).default([]),
  suggestedQuestions: z.array(z.string()).default([]),
  reasoning: z.array(ReasoningSchema).optional(),
  references: z.array(ReferenceSchema).default([]),
});

export type Claim = z.infer<typeof ClaimSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type Reasoning = z.infer<typeof ReasoningSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type Reference = z.infer<typeof ReferenceSchema>;
export type ExplanationItem = z.infer<typeof ExplanationItemSchema>;
export type SalaryBenefitAssessment = z.infer<typeof SalaryBenefitAssessmentSchema>;
export type AnalysisResult = z.infer<typeof AnalysisSchema>;
