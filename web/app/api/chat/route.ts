import { NextRequest, NextResponse } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { runAnalysis } from "@/langchain/agents/analyzer/analyze";
import { handleUIAction } from "@/langchain/agents/analyzer/action-handler";
import { answerFollowUp } from "@/langchain/agents/analyzer/follow-up";
import { decideTurnMode } from "@/langchain/agents/analyzer/turn-router";
import { findPostingContext, recentTurns, toMessageList } from "@/langchain/agents/analyzer/conversation-context";
import { isSupportedAttachment } from "@/langchain/agents/analyzer/extraction";
import { DEFAULT_ANALYSIS_ACTIONS, UIActionPayloadSchema, type UIActionPayload } from "@/types/ui-actions";

const STREAM_CHUNK_DELAY_MS = 28;
const SECTION_STEP_DELAY_MS = 220;
const MAX_FOLLOW_UP_TURNS = 6;
const UNSUPPORTED_FILE_MESSAGE =
  "Format file ini belum bisa diperiksa. Kirim lowongan dalam bentuk gambar (poster atau screenshot), PDF, atau tempel teksnya.";

function extractLatestUserText(body: any): string {
  const lastMessage = body?.messages?.[body.messages.length - 1];
  if (!lastMessage) {
    return "";
  }

  if (Array.isArray(lastMessage.parts)) {
    return lastMessage.parts
      .filter((part: any) => part?.type === "text")
      .map((part: any) => String(part?.text ?? ""))
      .join("\n")
      .trim();
  }

  if (typeof lastMessage.content === "string") {
    return lastMessage.content.trim();
  }

  return "";
}

interface ExtractedFilePart {
  mediaType: string;
  url: string;
}

function extractLatestFileParts(body: any): { attachments: ExtractedFilePart[]; unsupportedCount: number } {
  const lastMessage = body?.messages?.[body.messages.length - 1];
  if (!lastMessage || !Array.isArray(lastMessage.parts)) {
    return { attachments: [], unsupportedCount: 0 };
  }

  const files: ExtractedFilePart[] = lastMessage.parts
    .filter((part: any) => part?.type === "file" && typeof part?.mediaType === "string")
    .map((part: any) => ({ mediaType: part.mediaType as string, url: String(part?.url ?? "") }))
    .filter((part: ExtractedFilePart) => part.url.length > 0);

  const attachments = files.filter((file) => isSupportedAttachment(file.mediaType));
  return { attachments, unsupportedCount: files.length - attachments.length };
}

function extractUIActionPayload(body: any): UIActionPayload | null {
  const rawPayload =
    body?.action_payload ??
    body?.ui_action_payload ??
    body?.uiActionPayload ??
    null;

  const isActionRequest = body?.action_type === "UI_ACTION" || rawPayload?.type === "UI_ACTION";

  if (!isActionRequest || !rawPayload) {
    return null;
  }

  const parsed = UIActionPayloadSchema.safeParse(rawPayload);
  return parsed.success ? parsed.data : null;
}

function buildStreamText(analysis: { conversationText?: string }): string {
  const conversationText = analysis.conversationText?.trim() ?? "";
  return conversationText.length > 0
    ? conversationText
    : "Saya siap membantu telaah risiko lowongan. Tempel poster, teks, atau link yang ingin dicek.";
}

// Each chunk carries the whitespace before its word, so line breaks (Markdown lists) survive.
function chunkByWords(text: string): string[] {
  const chunks = text.trim().match(/\s*\S+/g);
  return chunks?.length ? chunks : [""];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamTextBlock({
  writer,
  text,
  id,
}: {
  writer: any;
  text: string;
  id: string;
}) {
  if (!text.trim().length) {
    return;
  }

  writer.write({ type: "text-start", id });
  for (const delta of chunkByWords(text)) {
    writer.write({ type: "text-delta", id, delta });
    await sleep(STREAM_CHUNK_DELAY_MS);
  }
  writer.write({ type: "text-end", id });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const actionPayload = extractUIActionPayload(body);
    const input = extractLatestUserText(body);
    const { attachments, unsupportedCount } = extractLatestFileParts(body);

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        if (actionPayload) {
          const openingTextId = `action-opening-${Date.now()}`;
          const closingTextId = `action-closing-${Date.now()}`;
          const result = await handleUIAction(actionPayload, body?.messages);

          await streamTextBlock({
            writer,
            text: result.openingText,
            id: openingTextId,
          });
          await sleep(SECTION_STEP_DELAY_MS);

          writer.write({
            type: "data-action-insight",
            data: {
              actionId: actionPayload.actionId,
              title: result.title,
              points: result.points,
            },
          });
          await sleep(SECTION_STEP_DELAY_MS);

          if (result.salaryBenefit) {
            writer.write({ type: "data-salary-benefit", data: result.salaryBenefit });
            await sleep(SECTION_STEP_DELAY_MS);
          }

          if (result.references?.length) {
            writer.write({ type: "data-references", data: result.references });
            await sleep(SECTION_STEP_DELAY_MS);
          }

          await streamTextBlock({
            writer,
            text: result.closingText,
            id: closingTextId,
          });
          await sleep(SECTION_STEP_DELAY_MS);

          writer.write({
            type: "data-actions",
            data: { actions: DEFAULT_ANALYSIS_ACTIONS },
          });

          return;
        }

        // Questions about the posting under discussion (or general ones) are answered with that
        // context instead of being analyzed as if they were a new posting.
        const messages = toMessageList(body?.messages);
        const latestIndex = messages.length - 1;
        const context = findPostingContext(messages, latestIndex - 1);
        if (unsupportedCount && !attachments.length && !input.length) {
          await streamTextBlock({ writer, text: UNSUPPORTED_FILE_MESSAGE, id: `unsupported-file-${Date.now()}` });
          return;
        }

        const decision = await decideTurnMode({ text: input, imageCount: attachments.length, context });

        if (decision.mode === "follow_up") {
          const turns = recentTurns(messages, context ? context.analysisIndex + 1 : 0, latestIndex, MAX_FOLLOW_UP_TURNS);
          const { result, meta } = await answerFollowUp({ question: input, context, turns });
          console.info("[chat] follow-up run", JSON.stringify({ route: decision.reason, ...meta }));

          await streamTextBlock({ writer, text: result.answer, id: `follow-up-${Date.now()}` });

          if (result.references.length) {
            await sleep(SECTION_STEP_DELAY_MS);
            writer.write({ type: "data-references", data: result.references });
          }
          if (result.suggestedQuestions.length) {
            await sleep(SECTION_STEP_DELAY_MS);
            writer.write({ type: "data-suggested-questions", data: result.suggestedQuestions });
          }
          return;
        }

        const openingTextId = `analysis-opening-${Date.now()}`;
        const followupTextId = `analysis-followup-${Date.now()}`;
        const closingTextId = `analysis-closing-${Date.now()}`;
        const reasoningPartId = `analysis-reasoning-${Date.now()}`;

        // Each pipeline stage reports as it actually finishes, so the "thinking" panel shows real
        // progress (rules, web search, model) instead of a replay after the fact.
        const { result: analysis, meta } = await runAnalysis(
          { input, images: attachments },
          {
            onProgress: (reasoning) => writer.write({ type: "data-reasoning", id: reasoningPartId, data: reasoning }),
          }
        );
        // Metadata only: never log the posting or the analysis text.
        console.info("[chat] analysis run", JSON.stringify({ route: decision.reason, ...meta }));

        const openingText = buildStreamText(analysis);
        await streamTextBlock({
          writer,
          text: openingText,
          id: openingTextId,
        });
        await sleep(SECTION_STEP_DELAY_MS);

        if (analysis.reasoning?.length) {
          writer.write({ type: "data-reasoning", id: reasoningPartId, data: analysis.reasoning });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        if (analysis.summary?.trim().length) {
          writer.write({
            type: "data-summary",
            data: {
              text: analysis.summary,
              citations: analysis.summaryCitations ?? [],
            },
          });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        if (analysis.claims?.length) {
          // Claim text is rendered by ClaimCard below; avoid streaming it twice as a plain text bubble.
          writer.write({ type: "data-claims", data: analysis.claims });
          await sleep(SECTION_STEP_DELAY_MS);
        } else {
          await streamTextBlock({
            writer,
            text: "Ceritakan detail lowongannya (teks, link, atau poster) supaya saya bisa bantu telaah.",
            id: followupTextId,
          });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        if (analysis.salaryBenefit) {
          writer.write({ type: "data-salary-benefit", data: analysis.salaryBenefit });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        if (analysis.risks?.length) {
          writer.write({ type: "data-risks", data: analysis.risks });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        if (analysis.explanations?.length) {
          writer.write({ type: "data-explanation", data: analysis.explanations });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        if (analysis.references?.length) {
          writer.write({ type: "data-references", data: analysis.references });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        const hasRiskVerdict = analysis.claims.length > 0;

        if (hasRiskVerdict) {
          writer.write({
            type: "data-actions",
            data: { actions: DEFAULT_ANALYSIS_ACTIONS },
          });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        const closingText = hasRiskVerdict
          ? "Kalau kamu mau, kita bisa lanjutkan dengan investigasi spesifik lewat tombol aksi di bawah."
          : "Kalau ada bagian yang ingin didalami, beri tahu saya.";
        await streamTextBlock({
          writer,
          text: closingText,
          id: closingTextId,
        });
        await sleep(SECTION_STEP_DELAY_MS);

        if (analysis.suggestedQuestions?.length) {
          writer.write({ type: "data-suggested-questions", data: analysis.suggestedQuestions });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        // Keep compatibility for existing consumers and historical parsing paths.
        writer.write({ type: "data-analysis", data: analysis });
      },

      onError: (error) => (error instanceof Error ? error.message : "Unknown stream error"),
    });


    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
