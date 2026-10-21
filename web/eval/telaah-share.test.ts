/**
 * Checks for the TelaahBareng signed payload and the "sudah ditelaah sebelumnya" scoring
 * (langchain/agents/telaah-bersama/share-payload.ts and similar.ts).
 *
 *   pnpm test:telaah
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { AnalysisResult } from "../langchain/agents/analyzer/schema";
import {
  buildSharePayload,
  isSubsequence,
  readSignedShare,
  sha256OfDataUrl,
  signSharePayload,
} from "../langchain/agents/telaah-bersama/share-payload";
import { materialFeatures, scoreCandidate, type SimilarCandidate } from "../langchain/agents/telaah-bersama/similar";
import { flagComment } from "../langchain/agents/telaah-bersama/moderation";
import type { TelaahPost } from "../lib/telaah-bersama/types";

test("comments that reassure without evidence are flagged, warnings are not", () => {
  assert.equal(flagComment("Aman kok, saya sudah digaji. Transfer saja biar cepat."), "klaim_tanpa_bukti");
  assert.equal(flagComment("Ini bukan penipuan, terpercaya"), "klaim_tanpa_bukti");
  assert.equal(flagComment("Katanya aman, ternyata uangnya tidak bisa ditarik"), null);
  assert.equal(flagComment("Saya juga dapat surat yang sama, nomor WA-nya sama persis."), null);
});

function analysis(riskLevel: "rendah" | "sedang" | "tinggi"): AnalysisResult {
  return {
    conversationText: "",
    claims: [{ text: `Tingkat Risiko Awal: ${riskLevel}.`, confidence: 0.8, riskLevel }],
    risks: [{ type: "payment_request", description: "Diminta transfer", evidence: "transfer Rp1.350.000" }],
    summary: "Ringkasan",
    summaryCitations: [],
    explanations: [],
    suggestedQuestions: [],
    references: [],
  };
}

const MATERIAL = "Kepada Yth. Rina\nNIK 3201234567890001\nTransfer Rp1.350.000 ke BRI 0000-01-778899-50-1\nWA 0812-0000-4471";
const IMAGE = `data:image/png;base64,${Buffer.from("poster").toString("base64")}`;

test("only Sedang and Tinggi verdicts can be shared", () => {
  assert.equal(buildSharePayload({ analysis: analysis("rendah"), userText: MATERIAL, attachments: [] }), null);
  assert.ok(buildSharePayload({ analysis: analysis("sedang"), userText: MATERIAL, attachments: [] }));
});

test("the payload masks the NIK, keeps the posting's contacts, and hashes images", () => {
  const payload = buildSharePayload({
    analysis: analysis("tinggi"),
    userText: MATERIAL,
    attachments: [IMAGE, "data:application/pdf;base64,AAAA"].map((url) => ({ url, mediaType: url.slice(5, url.indexOf(";")) })),
  })!;

  assert.deepEqual(payload.materialLines[1], "NIK [NIK disensor]");
  assert.ok(payload.identifiers.some((item) => item.kind === "phone" && item.value === "6281200004471"));
  assert.ok(payload.identifiers.some((item) => item.kind === "account"));
  // The PDF is analyzed but never published
  assert.deepEqual(payload.attachments.map((item) => item.sha256), [sha256OfDataUrl(IMAGE)]);
});

test("a changed payload or a forged signature is rejected", () => {
  const signed = signSharePayload(buildSharePayload({ analysis: analysis("tinggi"), userText: MATERIAL, attachments: [] })!);

  assert.ok(readSignedShare(signed));
  assert.equal(readSignedShare({ ...signed, payload: signed.payload.replace("tinggi", "sedang") }), null);
  assert.equal(readSignedShare({ ...signed, signature: "00".repeat(32) }), null);
  assert.equal(readSignedShare({ payload: signed.payload }), null);
});

test("material can only shrink", () => {
  assert.equal(isSubsequence(["a", "c"], ["a", "b", "c"]), true);
  assert.equal(isSubsequence(["c", "a"], ["a", "b", "c"]), false);
  assert.equal(isSubsequence(["a", "x"], ["a", "b", "c"]), false);
});

function candidate(overrides: Omit<Partial<SimilarCandidate>, "post"> & { post?: Partial<TelaahPost> } = {}): SimilarCandidate {
  return {
    cosine: 0.7,
    sharedIdentifiers: [],
    identifiers: [],
    ...overrides,
    post: { id: 128, company: null, openDate: null, closeDate: null, ...overrides.post } as TelaahPost,
  };
}

test("a shared number is enough when the text is related", () => {
  const features = materialFeatures("Konfirmasi ke WA 0812-0000-4471");
  const match = scoreCandidate(candidate({ cosine: 0.65, sharedIdentifiers: [{ kind: "phone", value: "6281200004471" }] }), features);
  assert.deepEqual(match?.reasons, ["Nomor WA/HP sama"]);
  assert.equal(scoreCandidate(candidate({ cosine: 0.4, sharedIdentifiers: [{ kind: "phone", value: "x" }] }), features), null);
});

test("without a shared contact the text must be nearly the same", () => {
  const features = materialFeatures("Kerja paruh waktu like dan follow");
  assert.equal(scoreCandidate(candidate({ cosine: 0.85 }), features), null);
  assert.deepEqual(scoreCandidate(candidate({ cosine: 0.93 }), features)?.reasons, ["Isi lowongan sangat mirip"]);
});

test("the official posting is never referred to a fake one that uses the same company", () => {
  const features = materialFeatures("PT Listrik Nusantara membuka lowongan. Daftar di karier.listriknusantara.co.id");
  const fake = candidate({
    cosine: 0.95,
    post: { company: "PT Listrik Nusantara (Persero)" },
    identifiers: [{ kind: "domain", value: "karier-listriknusantara.example" }],
  });
  assert.equal(scoreCandidate(fake, features), null);
});

test("an official site is never referred to a fake on another site, even without a company name", () => {
  const features = materialFeatures("Program Magang Nasional dibuka, daftar gratis di magangnasional.kemnaker.go.id");
  const fake = candidate({ cosine: 0.95, identifiers: [{ kind: "domain", value: "pendaftaran-magangnasional.example" }] });
  assert.equal(scoreCandidate(fake, features), null);

  // ...unless they share a contact, which the official site would not
  const sharesNumber = candidate({ ...fake, sharedIdentifiers: [{ kind: "phone", value: "6281200004471" }] });
  assert.ok(scoreCandidate(sharesNumber, features));
});

test("a template reposted for another period is shown as an earlier version", () => {
  const features = materialFeatures("Pendaftaran sampai 20 Maret 2027");
  const match = scoreCandidate(candidate({ cosine: 0.95, post: { openDate: "2026-10-01", closeDate: "2026-10-30" } }), features);
  assert.equal(match?.differentPeriod, true);
  assert.ok(match?.reasons.includes("Versi sebelumnya, periode berbeda"));

  const same = scoreCandidate(candidate({ cosine: 0.95, post: { openDate: "2026-10-01", closeDate: "2026-10-30" } }), materialFeatures("ditutup 30 Oktober 2026"));
  assert.ok(same?.reasons.includes("Periode pendaftaran tumpang-tindih"));
});
