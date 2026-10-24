/**
 * Checks that a later stage of a posting is analyzed together with what the session already sent
 * (langchain/agents/analyzer/conversation-context.ts).
 *
 *   pnpm test:context
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { findPostingContext, messagesNeedingAttachments, type LooseMessage } from "../langchain/agents/analyzer/conversation-context";
import { classifyNewMaterial, decideTurnMode } from "../langchain/agents/analyzer/turn-router";

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

test("stored attachments are loaded back only where the model reads the image again", () => {
  const withFile = (text: string): LooseMessage => ({
    role: "user",
    parts: [{ type: "text", text }, { type: "file", mediaType: "image/png", url: "/api/chat/attachments/a/b" }],
  });
  const messages = [
    withFile("poster jelas"),
    verdict({ transcript: "isi poster", legibility: "jelas" }),
    withFile("poster buram"),
    verdict({ transcript: "isi sebagian", legibility: "sebagian" }),
    user("tanpa lampiran"),
    verdict({}),
    withFile("poster baru"),
  ];
  assert.deepEqual(messagesNeedingAttachments(messages), [2, 6]);

  // A link that was not loaded back is never sent to the model
  const context = findPostingContext(messages, 3)!;
  assert.deepEqual(context.images, []);
});

test("another posting link on the same job board is a new posting; the same link is not", async () => {
  const context = {
    postingText: "https://glints.com/id/opportunities/jobs/243fb988-cb24/share/a46b52a1\napakah loker ini aman?",
    material: "",
    images: [],
    analysis: { summary: "Lowongan .Net Developer" },
    analysisIndex: 1,
  };
  const other = await classifyNewMaterial({ materialText: "https://glints.com/id/opportunities/jobs/1eb4b6ad-4644/share/88eebfe8", context });
  assert.deepEqual(other, { isNewPosting: true, reason: "different_posting_link" });

  const same = await classifyNewMaterial({ materialText: "https://glints.com/id/opportunities/jobs/243fb988-cb24/share/ffff0000", context });
  assert.deepEqual(same, { isNewPosting: false, reason: "shared_contact" });
});

test("a message with a link is analyzed, even when it is phrased as a question", async () => {
  const decision = await decideTurnMode({
    text: "https://glints.com/id/opportunities/jobs/243fb988-cb24/share/a46b52a1 apakah loker ini aman?",
    imageCount: 0,
    context: null,
  });
  assert.deepEqual(decision, { mode: "analysis", reason: "link" });
});

test("the first analysis of a session has nothing earlier to carry", () => {
  const messages = [user("POSTER 1"), verdict({})];
  assert.equal(findPostingContext(messages, 1)!.material, "POSTER 1");
});
