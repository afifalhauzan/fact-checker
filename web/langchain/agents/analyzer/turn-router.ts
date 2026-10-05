import { getLLMModel } from "./llm";
import { LLMRouterOutputSchema } from "./schema";
import { buildRouterUserPrompt, routerSystemPrompt } from "./prompts";
import { preprocessJobInput } from "./preprocessor";
import type { PostingContext } from "./conversation-context";

export type TurnMode = "analysis" | "follow_up";

export interface TurnDecision {
  mode: TurnMode;
  reason: "image" | "empty_text" | "long_text" | "not_substantive" | "classifier" | "classifier_fallback";
}

// Anything longer is pasted material (a posting or a recruiter chat), not a question.
const MAX_QUESTION_LENGTH = 500;
const ROUTER_TIMEOUT_MS = 10_000;
const CONTEXT_SUMMARY_LENGTH = 200;

/**
 * Decides whether the latest message is new material for the analysis pipeline or a question to
 * answer in the context of the posting under discussion. Clear cases are decided by rules; only
 * short text-only messages pay for a model call.
 */
export async function decideTurnMode({
  text,
  imageCount,
  context,
}: {
  text: string;
  imageCount: number;
  context: PostingContext | null;
}): Promise<TurnDecision> {
  const trimmed = text.trim();

  if (imageCount > 0) {
    return { mode: "analysis", reason: "image" };
  }
  if (!trimmed.length) {
    return { mode: "analysis", reason: "empty_text" };
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return { mode: "analysis", reason: "long_text" };
  }
  // With nothing under discussion, trivial messages ("halo") get the analysis path's cheap reply.
  if (!context && !preprocessJobInput(trimmed).hasSubstantiveContent) {
    return { mode: "analysis", reason: "not_substantive" };
  }

  const summarySource = context?.analysis.summary || context?.postingText || "";
  const contextSummary = summarySource ? summarySource.slice(0, CONTEXT_SUMMARY_LENGTH) : null;

  try {
    const router = getLLMModel({ temperature: 0 }).withStructuredOutput(LLMRouterOutputSchema);
    const { intent } = await router.invoke(
      [
        { role: "system", content: routerSystemPrompt },
        { role: "user", content: buildRouterUserPrompt({ message: trimmed, contextSummary }) },
      ],
      { signal: AbortSignal.timeout(ROUTER_TIMEOUT_MS) }
    );
    return { mode: intent === "pertanyaan" ? "follow_up" : "analysis", reason: "classifier" };
  } catch (error) {
    console.error("[TurnRouter] Classification failed, using heuristic:", error instanceof Error ? error.message : error);
    return { mode: trimmed.endsWith("?") ? "follow_up" : "analysis", reason: "classifier_fallback" };
  }
}
