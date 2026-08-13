import { z } from "zod";

export const RiskTypeSchema = z.enum(["bias", "overclaim", "missing_context"]);

export const CitationSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  title: z.string(),
  link: z.string(),
});

export const ReferenceSchema = z.object({
  title: z.string(),
  snippet: z.string().optional(),
  url: z.string().optional(),
  citations: z.array(
    z.object({
      id: z.string(),
      label: z.string().optional(),
      title: z.string(),
      link: z.string(),
    })
  ),
});

export const ExplanationItemSchema = z.object({
  title: z.string(),
  explanation: z.string(),
});

export const SalaryBenefitAssessmentSchema = z.object({
  title: z.string(),
  status: z.string(),
  summary: z.string(),
  highlights: z.array(z.string()),
  hint: z.string().optional(),
});

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

/**
 * Inlined Zod schema for Gemini API compatibility.
 * Avoids JSON Schema $ref / $defs generation which is rejected by Gemini API.
 */
export const AnalysisSchema = z.object({
  conversationText: z.string().describe("MUST ONLY contain AI opening greeting. NEVER copy the user's input text here."),
  claims: z.array(
    z.object({
      text: z.string(),
      confidence: z.number().min(0).max(1),
    })
  ),
  salaryBenefit: z
    .object({
      title: z.string(),
      status: z.string(),
      summary: z.string(),
      highlights: z.array(z.string()),
      hint: z.string().optional(),
    })
    .optional(),
  risks: z.array(
    z.object({
      type: RiskTypeSchema,
      description: z.string(),
    })
  ),
  summary: z.string(),
  summaryCitations: z.array(
    z.object({
      id: z.string(),
      label: z.string().optional(),
      title: z.string(),
      link: z.string(),
    })
  ),
  explanations: z.array(
    z.object({
      title: z.string(),
      explanation: z.string(),
    })
  ),
  suggestedQuestions: z.array(z.string()),
  reasoning: z
    .array(
      z.object({
        intent: z.string(),
        steps: z.array(z.string()),
      })
    )
    .optional(),
  references: z.array(
    z.object({
      title: z.string(),
      snippet: z.string().optional(),
      url: z.string().optional(),
      citations: z.array(
        z.object({
          id: z.string(),
          label: z.string().optional(),
          title: z.string(),
          link: z.string(),
        })
      ),
    })
  ),
});

export type Claim = z.infer<typeof ClaimSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type Reasoning = z.infer<typeof ReasoningSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type Reference = z.infer<typeof ReferenceSchema>;
export type ExplanationItem = z.infer<typeof ExplanationItemSchema>;
export type SalaryBenefitAssessment = z.infer<typeof SalaryBenefitAssessmentSchema>;
export type AnalysisResult = z.infer<typeof AnalysisSchema>;
