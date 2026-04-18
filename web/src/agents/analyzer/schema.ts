import { z } from "zod";

export const RiskTypeSchema = z.enum(["bias", "overclaim", "missing_context"]);

export const AnalysisSchema = z.object({
  claims: z.array(
    z.object({
      text: z.string(),
      confidence: z.number().min(0).max(1),
    })
  ),
  risks: z.array(
    z.object({
      type: RiskTypeSchema,
      description: z.string(),
    })
  ),
  summary: z.string(),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;
