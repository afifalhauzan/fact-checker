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

export const AnalysisSchema = z.object({
  claims: z.array(ClaimSchema),
  risks: z.array(RiskSchema),
  summary: z.string(),
  explanation: z.string().optional(),
});

export type Claim = z.infer<typeof ClaimSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type AnalysisResult = z.infer<typeof AnalysisSchema>;
