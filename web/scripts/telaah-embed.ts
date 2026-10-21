/**
 * Adds embeddings to TelaahBareng posts that have none: seed posts, or posts whose embedding
 * call failed at publish time. Safe to run again; it only touches posts without one.
 *
 *   pnpm telaah:embed                 (BACKEND_URL defaults to http://localhost:8000/api)
 */
import "dotenv/config";
import { backendFetch, internalKeyHeader } from "../lib/server-auth";
import { embedText, embeddingTextFor } from "../langchain/agents/telaah-bersama/embeddings";

interface MissingPost {
  id: number;
  title: string;
  material_lines: string[];
}

async function main() {
  const response = await backendFetch("/telaah-bersama/missing-embeddings", { headers: internalKeyHeader() });
  if (!response.ok) throw new Error(`missing-embeddings returned ${response.status}`);
  const posts: MissingPost[] = (await response.json()).data;

  let done = 0;
  for (const post of posts) {
    const embedding = await embedText(embeddingTextFor(post.material_lines));
    if (!embedding) {
      console.error(`#${post.id}: embedding failed, skipped`);
      continue;
    }
    const saved = await backendFetch(`/telaah-bersama/${post.id}/embedding`, {
      method: "PUT",
      headers: internalKeyHeader(),
      body: JSON.stringify({ embedding }),
    });
    if (saved.ok) done += 1;
    else console.error(`#${post.id}: saving returned ${saved.status}`);
  }

  console.log(`Embedded ${done} of ${posts.length} posts.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
