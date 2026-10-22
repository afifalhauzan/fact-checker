import { backendFetch } from "@/lib/server-auth";
import { messagesNeedingAttachments, toMessageList } from "@/langchain/agents/analyzer/conversation-context";

// The link Laravel stores in place of an attachment (ConversationController::withStoredFiles).
const STORED_URL = /^\/api\/chat\/attachments\/([0-9a-f-]{36})\/([0-9a-f-]{36})$/i;

/**
 * In a reloaded session the client sends attachments as links to the stored files. Loads back,
 * as data URLs, the ones the model will read again; the rest stay links and are skipped.
 * Changes the messages in place.
 */
export async function loadStoredAttachments(messages: unknown, token: string | null): Promise<void> {
  if (!token) return;
  const list = toMessageList(messages);

  const parts = messagesNeedingAttachments(list)
    .flatMap((index) => list[index].parts ?? [])
    .filter((part) => part.type === "file" && typeof part.url === "string" && STORED_URL.test(part.url));

  await Promise.all(
    parts.map(async (part) => {
      const [, conversationId, attachmentId] = (part.url as string).match(STORED_URL)!;
      try {
        const response = await backendFetch(`/conversations/${conversationId}/attachments/${attachmentId}`, { token });
        if (!response.ok) return;
        const type = part.mediaType || response.headers.get("Content-Type") || "application/octet-stream";
        part.url = `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
      } catch (error) {
        console.error("[StoredAttachments] Could not load an attachment:", error instanceof Error ? error.message : error);
      }
    })
  );
}
