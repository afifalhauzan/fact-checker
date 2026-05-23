import { NextRequest, NextResponse } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { analyzeContent, handleMockUIAction } from "@/langchain/agents/analyzer/analyze";
import { DEFAULT_ANALYSIS_ACTIONS, UIActionPayloadSchema, type UIActionPayload } from "@/types/ui-actions";

const STREAM_CHUNK_DELAY_MS = 28;
const REASONING_STEP_MIN_DELAY_MS = 1000;
const REASONING_STEP_MAX_DELAY_MS = 2000;
const SECTION_STEP_DELAY_MS = 220;

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
  return conversationText.length > 0 ? conversationText : "I am ready. Please share what you want to analyze.";
}

function chunkByWords(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  return words.map((word, index) => (index === 0 ? word : ` ${word}`));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildReasoningSnapshots(
  reasoning?: Array<{ intent?: string; steps?: string[] }>
): Array<Array<{ intent: string; steps: string[] }>> {
  if (!reasoning?.length) {
    return [];
  }

  const normalized = reasoning
    .map((block) => ({
      intent: block.intent?.trim() ?? "",
      steps: Array.isArray(block.steps) ? block.steps.filter((step): step is string => typeof step === "string") : [],
    }))
    .filter((block) => block.intent.length > 0 && block.steps.length > 0);

  if (!normalized.length) {
    return [];
  }

  const snapshots: Array<Array<{ intent: string; steps: string[] }>> = [];
  const progressive = normalized.map((block) => ({
    intent: block.intent,
    steps: [] as string[],
  }));

  for (let blockIndex = 0; blockIndex < normalized.length; blockIndex += 1) {
    for (const step of normalized[blockIndex].steps) {
      progressive[blockIndex] = {
        ...progressive[blockIndex],
        steps: [...progressive[blockIndex].steps, step],
      };

      snapshots.push(
        progressive.map((block) => ({
          intent: block.intent,
          steps: [...block.steps],
        }))
      );
    }
  }

  return snapshots;
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

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        if (actionPayload) {
          const openingTextId = `action-opening-${Date.now()}`;
          const closingTextId = `action-closing-${Date.now()}`;
          const result = handleMockUIAction(actionPayload);

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

        const analysis = await analyzeContent({ input });
        console.log("Generated analysis:", analysis);

        const openingTextId = `analysis-opening-${Date.now()}`;
        const followupTextId = `analysis-followup-${Date.now()}`;
        const closingTextId = `analysis-closing-${Date.now()}`;
        const reasoningPartId = `analysis-reasoning-${Date.now()}`;

        // Stream reasoning first, step-by-step, to mimic a "thinking" phase.
        const reasoningSnapshots = buildReasoningSnapshots(analysis.reasoning);
        for (const snapshot of reasoningSnapshots) {
          writer.write({ type: "data-reasoning", id: reasoningPartId, data: snapshot });
          await sleep(randomInt(REASONING_STEP_MIN_DELAY_MS, REASONING_STEP_MAX_DELAY_MS));
        }

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

        const followupText = analysis.claims?.length
          ? `Klaim utama yang saya tangkap: "${analysis.claims[0].text}".`
          : "Mari lanjut ke konteks dan detail pendukung.";
        await streamTextBlock({
          writer,
          text: followupText,
          id: followupTextId,
        });
        await sleep(SECTION_STEP_DELAY_MS);

        if (analysis.claims?.length) {
          writer.write({ type: "data-claims", data: analysis.claims });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        if (analysis.risks?.length) {
          writer.write({ type: "data-risks", data: analysis.risks });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        if (analysis.explanation?.trim().length) {
          writer.write({ type: "data-explanation", data: analysis.explanation });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        if (analysis.references?.length) {
          writer.write({ type: "data-references", data: analysis.references });
          await sleep(SECTION_STEP_DELAY_MS);
        }

        writer.write({
          type: "data-actions",
          data: { actions: DEFAULT_ANALYSIS_ACTIONS },
        });
        await sleep(SECTION_STEP_DELAY_MS);

        const closingText = analysis.suggestedQuestions?.length
          ? "Kalau kamu mau, saya bisa lanjutkan ke pertanyaan lanjutan berikut."
          : "Jika ada bagian yang ingin didalami, beri tahu saya.";
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
