// Text embeddings for finding TelaahBareng posts similar to new material (design doc 6.7).
// Gemini's REST API is called directly: it takes outputDimensionality, which keeps vectors at the
// 768 dimensions the pgvector HNSW index is built for.

export const EMBEDDING_DIMENSIONS = 768;

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const EMBEDDING_TIMEOUT_MS = 8_000;
// Well under the model's 2,048-token input limit.
const MAX_EMBEDDING_CHARS = 6_000;

/** The text a posting is compared on: its material lines, the same for a post and for new material. */
export function embeddingTextFor(materialLines: string[]): string {
  return materialLines.join("\n").slice(0, MAX_EMBEDDING_CHARS);
}

/** Returns null when no key is set or the call fails; matching then falls back to shared contacts. */
export async function embedText(text: string, signal?: AbortSignal): Promise<number[] | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || !text.trim()) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text: text.slice(0, MAX_EMBEDDING_CHARS) }] },
          taskType: "SEMANTIC_SIMILARITY",
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
        signal: signal ?? AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
      }
    );
    if (!response.ok) {
      console.error("[Embeddings] Request failed with status", response.status);
      return null;
    }

    const values = (await response.json())?.embedding?.values;
    return Array.isArray(values) && values.length === EMBEDDING_DIMENSIONS ? values : null;
  } catch (error) {
    console.error("[Embeddings] Request failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
