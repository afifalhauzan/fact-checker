import { z } from "zod";
import { getLLMModel } from "./llm";
import { LLMRouterOutputSchema } from "./schema";
import {
  buildPostingContinuationUserPrompt,
  buildRouterUserPrompt,
  postingContinuationSystemPrompt,
  routerSystemPrompt,
} from "./prompts";
import { preprocessJobInput } from "./preprocessor";
import type { PostingContext } from "./conversation-context";
import { findContacts } from "../telaah-bersama/identifiers";

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
    const router = getLLMModel({ temperature: 0, stage: "router" }).withStructuredOutput(LLMRouterOutputSchema);
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

export interface ContinuationDecision {
  isNewPosting: boolean;
  reason: "shared_contact" | "classifier" | "classifier_fallback";
}

const ContinuationSchema = z.object({ hubungan: z.enum(["materi_lanjutan", "lowongan_baru"]) });
const SESSION_DESCRIPTION_LENGTH = 800;
const NEW_MATERIAL_LENGTH = 1_500;

/**
 * One session holds one posting (design doc 6.11). When new material arrives in a session that
 * already has an analysis, decides whether it is a later stage of that posting or another one.
 * Errs toward "same posting": a wrong warning interrupts someone working through one posting.
 */
export async function classifyNewMaterial({
  materialText,
  context,
}: {
  materialText: string;
  context: PostingContext;
}): Promise<ContinuationDecision> {
  // A number, account, email, or link the session posting also has settles it without a model call.
  const sessionValues = new Set(findContacts(context.postingText).identifiers.map((item) => `${item.kind}|${item.value}`));
  if (findContacts(materialText).identifiers.some((item) => sessionValues.has(`${item.kind}|${item.value}`))) {
    return { isNewPosting: false, reason: "shared_contact" };
  }

  const session = [context.analysis.summary, context.postingText].filter(Boolean).join("\n").slice(0, SESSION_DESCRIPTION_LENGTH);

  try {
    const classifier = getLLMModel({ temperature: 0, stage: "router" }).withStructuredOutput(ContinuationSchema);
    const { hubungan } = await classifier.invoke(
      [
        { role: "system", content: postingContinuationSystemPrompt },
        {
          role: "user",
          content: buildPostingContinuationUserPrompt({ session, material: materialText.slice(0, NEW_MATERIAL_LENGTH) }),
        },
      ],
      { signal: AbortSignal.timeout(ROUTER_TIMEOUT_MS) }
    );
    return { isNewPosting: hubungan === "lowongan_baru", reason: "classifier" };
  } catch (error) {
    console.error("[TurnRouter] Continuation check failed, treating as the same posting:", error instanceof Error ? error.message : error);
    return { isNewPosting: false, reason: "classifier_fallback" };
  }
}
