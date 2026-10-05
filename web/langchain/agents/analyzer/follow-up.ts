import { getLLMModel, LLM_TIMEOUT_MS, readTokenUsage, type TokenUsage } from "./llm";
import { LLMFollowUpOutputSchema, type Reference } from "./schema";
import { buildFollowUpUserPrompt, followUpSystemPrompt } from "./prompts";
import {
  contextSources,
  formatAnalysisContext,
  type ConversationTurn,
  type PostingContext,
} from "./conversation-context";
import { normalizeSourceId, type SearchSource } from "./tools/tavily-search";

export interface FollowUpResult {
  answer: string;
  references: Reference[];
  suggestedQuestions: string[];
}

export interface FollowUpRunMeta {
  hasContext: boolean;
  // Cited source IDs (in the field or inline markers) that do not exist, removed.
  droppedSourceIds: number;
  timingsMs: { llm: number };
  tokenUsage?: TokenUsage;
  fallbackReason?: string;
}

const MAX_SUGGESTED_QUESTIONS = 3;
const FALLBACK_ANSWER =
  "Maaf, jawaban AI sedang tidak dapat dibuat. Coba tanyakan lagi beberapa saat lagi, atau gunakan tombol aksi pada hasil analisis.";

/**
 * Turns "[S1]" / "[S1, S3]" markers into the "[1]" / "[1, 3]" labels the user already saw on the
 * analysis, and removes markers that point to sources that were never retrieved.
 */
function rewriteCitationMarkers(
  answer: string,
  sources: SearchSource[],
  cited: Set<string>
): { text: string; dropped: number } {
  let dropped = 0;

  const text = answer.replace(/( ?)\[\s*(S\d+(?:\s*,\s*S\d+)*)\s*\]/gi, (_match, space: string, group: string) => {
    const labels: string[] = [];
    for (const rawId of group.split(",")) {
      const id = normalizeSourceId(rawId);
      const index = sources.findIndex((source) => source.id === id);
      if (index < 0) {
        dropped += 1;
        continue;
      }
      cited.add(id);
      labels.push(String(index + 1));
    }
    return labels.length ? `${space}[${labels.join(", ")}]` : "";
  });

  return { text, dropped };
}

export async function answerFollowUp({
  question,
  context,
  turns,
}: {
  question: string;
  context: PostingContext | null;
  turns: ConversationTurn[];
}): Promise<{ result: FollowUpResult; meta: FollowUpRunMeta }> {
  const startedAt = Date.now();
  const { references, sources } = contextSources(context?.analysis ?? null);
  const meta: FollowUpRunMeta = { hasContext: Boolean(context), droppedSourceIds: 0, timingsMs: { llm: 0 } };

  try {
    const structuredLlm = getLLMModel({ temperature: 0.3, stage: "follow_up" }).withStructuredOutput(LLMFollowUpOutputSchema, {
      includeRaw: true,
    });

    const prompt = buildFollowUpUserPrompt({
      question,
      turns,
      posting: context
        ? {
            text: context.postingText,
            imageCount: context.images.length,
            analysisContext: formatAnalysisContext(context.analysis),
            sources,
          }
        : null,
    });

    // Re-sending the poster lets the model answer questions about details only visible in it.
    const images = context?.images ?? [];
    const userContent = images.length
      ? [{ type: "text", text: prompt }, ...images.map((image) => ({ type: "image_url", image_url: image.url }))]
      : prompt;

    const { raw, parsed } = await structuredLlm.invoke(
      [
        { role: "system", content: followUpSystemPrompt },
        { role: "user", content: userContent },
      ],
      { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) }
    );

    if (!parsed) {
      throw new Error("Model output did not match LLMFollowUpOutputSchema");
    }
    meta.tokenUsage = readTokenUsage(raw);

    const cited = new Set<string>();
    const { text, dropped } = rewriteCitationMarkers(parsed.answer?.trim() ?? "", sources, cited);
    meta.droppedSourceIds = dropped;

    for (const rawId of parsed.sourceIds ?? []) {
      const id = normalizeSourceId(rawId);
      if (sources.some((source) => source.id === id)) {
        cited.add(id);
      } else {
        meta.droppedSourceIds += 1;
      }
    }

    return {
      result: {
        answer: text || FALLBACK_ANSWER,
        references: sources.flatMap((source, index) => (cited.has(source.id) ? [references[index]] : [])),
        suggestedQuestions: (parsed.suggestedQuestions ?? [])
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, MAX_SUGGESTED_QUESTIONS),
      },
      meta,
    };
  } catch (error) {
    meta.fallbackReason = error instanceof Error ? error.message : String(error);
    console.error("[FollowUp] Model answer failed:", meta.fallbackReason);
    return { result: { answer: FALLBACK_ANSWER, references: [], suggestedQuestions: [] }, meta };
  } finally {
    meta.timingsMs.llm = Date.now() - startedAt;
  }
}
