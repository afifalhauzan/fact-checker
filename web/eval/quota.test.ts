/**
 * Checks for the guest cookie (lib/quota.ts) and the continued session's seed (lib/compact-session.ts).
 *
 *   pnpm test:unit
 */
import { describe, expect, it } from "vitest";
import { guestSessionOf, signGuest } from "../lib/quota";
import { buildCompactSeed, CONTINUED_NOTE } from "../lib/compact-session";
import type { MetabotUIMessage } from "../types/streaming";

const SESSION = "5cb286de-0a9c-497d-a3da-822c6a04c27a";

describe("guest session cookie", () => {
  it("reads back the session it was signed for", () => {
    expect(guestSessionOf(signGuest(SESSION))).toBe(SESSION);
  });

  it("rejects a cookie edited to point at another session, or not signed here", () => {
    const other = "1e7241be-b927-407c-9ee1-8e79844b1e8d";
    const [, signature] = signGuest(SESSION).split(".");
    expect(guestSessionOf(`${other}.${signature}`)).toBeNull();
    expect(guestSessionOf(`${SESSION}.${"0".repeat(64)}`)).toBeNull();
    expect(guestSessionOf(undefined)).toBeNull();
    expect(guestSessionOf("bukan-uuid.abc")).toBeNull();
  });
});

const verdict = (summary: string, claims = [{ text: "Tingkat Risiko Awal: Tinggi.", confidence: 0.8, riskLevel: "tinggi" }]) =>
  ({ role: "assistant", parts: [{ type: "data-analysis", data: { summary, claims } }] }) as unknown as MetabotUIMessage;
const user = (text: string) => ({ role: "user", parts: [{ type: "text", text }] }) as unknown as MetabotUIMessage;

describe("continued session seed", () => {
  it("carries the latest analysis with a verdict and the posting it was for, not the Q&A after it", () => {
    let n = 0;
    const seed = buildCompactSeed(
      [user("poster pertama"), verdict("analisis pertama"), user("poster lanjutan"), verdict("analisis kedua"), user("pertanyaan"), verdict("jawaban", [])],
      () => `id-${++n}`
    )!;

    expect(seed.map((message) => message.role)).toEqual(["user", "assistant"]);
    expect(seed[0]).toMatchObject({ id: "id-1", parts: [{ type: "text", text: "poster lanjutan" }] });
    expect(seed[1].parts[0]).toEqual({ type: "text", text: CONTINUED_NOTE });
    expect((seed[1].parts[1] as any).data.summary).toBe("analisis kedua");
  });

  it("has nothing to carry without an analysis", () => {
    expect(buildCompactSeed([user("halo"), verdict("sapaan", [])])).toBeNull();
  });
});
