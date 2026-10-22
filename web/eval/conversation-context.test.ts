/**
 * Checks that a later stage of a posting is analyzed together with what the session already sent
 * (langchain/agents/analyzer/conversation-context.ts).
 *
 *   pnpm test:context
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { findPostingContext, type LooseMessage } from "../langchain/agents/analyzer/conversation-context";

const verdict = (material: Record<string, string>): LooseMessage => ({
  role: "assistant",
  parts: [
    {
      type: "data-analysis",
      data: {
        conversationText: "",
        claims: [{ text: "Tingkat Risiko Awal: Sedang.", confidence: 0.6, riskLevel: "sedang" }],
        summary: "Ringkasan",
        material: { source: "text", ...material },
      },
    },
  ],
});
const user = (text: string): LooseMessage => ({ role: "user", parts: [{ type: "text", text }] });

test("each stage carries the earlier ones, so a third poster still sees the first", () => {
  const messages = [
    user("POSTER 1: IDstar membuka magang, info di idstar.co.id"),
    verdict({}),
    user("POSTER 2: requirement Database Infrastructure"),
    verdict({ earlierMaterial: "POSTER 1: IDstar membuka magang, info di idstar.co.id", linkEvidence: "[Tujuan shortlink]\nx" }),
    user("POSTER 3: jadwal interview"),
  ];

  const context = findPostingContext(messages, messages.length - 2)!;
  assert.equal(context.material, "POSTER 1: IDstar membuka magang, info di idstar.co.id\n\nPOSTER 2: requirement Database Infrastructure");
  // Link evidence goes to follow-up questions, but is not carried into the next analysis
  assert.ok(context.postingText.endsWith("[Tujuan shortlink]\nx"));
  assert.ok(!context.material.includes("Tujuan shortlink"));
});

test("the first analysis of a session has nothing earlier to carry", () => {
  const messages = [user("POSTER 1"), verdict({})];
  assert.equal(findPostingContext(messages, 1)!.material, "POSTER 1");
});
