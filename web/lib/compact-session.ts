import type { MetabotUIMessage, MetabotUIMessagePart } from "@/types/streaming";

// "Lanjutkan di sesi baru" when a session is full: the new session starts with the posting and its
// latest analysis, copied as they are. The analysis already holds the transcript, the earlier
// material and the link evidence, so follow-ups work there without analyzing again; the Q&A turns
// are left behind. No model call is needed to compact.

export const CONTINUED_NOTE =
  "Lanjutan dari sesi sebelumnya yang sudah penuh. Hasil telaah terakhir di bawah ini dibawa sebagai konteks; riwayat tanya-jawabnya tidak ikut.";

function hasVerdict(message: MetabotUIMessage): MetabotUIMessagePart | undefined {
  return ((message.parts || []) as MetabotUIMessagePart[]).find((part) => {
    if (part.type !== "data-analysis") return false;
    try {
      const data = typeof part.data === "string" ? JSON.parse(part.data) : part.data;
      return Array.isArray(data?.claims) && data.claims.length > 0;
    } catch {
      return false;
    }
  });
}

/** The opening messages of the continued session, or null when there is no analysis to carry. */
export function buildCompactSeed(messages: MetabotUIMessage[], newId: () => string = () => crypto.randomUUID()): MetabotUIMessage[] | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const analysis = messages[i].role === "assistant" ? hasVerdict(messages[i]) : undefined;
    if (!analysis) continue;

    for (let j = i - 1; j >= 0; j -= 1) {
      if (messages[j].role !== "user") continue;
      return [
        { id: newId(), role: "user", parts: messages[j].parts },
        { id: newId(), role: "assistant", parts: [{ type: "text", text: CONTINUED_NOTE }, analysis] },
      ] as MetabotUIMessage[];
    }
    return null;
  }
  return null;
}
