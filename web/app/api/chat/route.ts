import { NextRequest, NextResponse } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { analyzeContent } from "@/langchain/agents/analyzer/analyze";

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

function chunkByWords(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  return words.map((word, index) => (index === 0 ? word : ` ${word}`));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = extractLatestUserText(body);
    const analysis = await analyzeContent({ input });

    console.log("Generated analysis:", analysis);

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const textId = `analysis-${Date.now()}`;
        writer.write({ type: "text-start", id: textId });

        const conversationText = `${analysis.conversationText}`;
        for (const delta of chunkByWords(conversationText)) {
          writer.write({ type: "text-delta", id: textId, delta });
          await Promise.resolve();
        }

        writer.write({ type: "text-end", id: textId });
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