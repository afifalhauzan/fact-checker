/**
 * Checks the document built for copy, PDF and sharing (lib/analysis-export).
 *
 *   pnpm test:export
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAnalysisExport, exportFilename, shareMessage, type ExportPart } from "../lib/analysis-export/build";
import { parseInline, parseMarkdown, toPlainMarkdown } from "../lib/analysis-export/markdown";
import { pdfSafe } from "../lib/analysis-export/pdf-text";

const NOW = new Date("2026-10-22T10:00:00Z");

const streamed: ExportPart[] = [
  { type: "data-reasoning", data: [{ intent: "Memeriksa", steps: ["langkah internal"] }] },
  { type: "text", text: "Halo! Saya telah menganalisis materi lowongan." },
  { type: "data-summary", data: { text: "Magang admin remote, gaji 9 juta, daftar via WhatsApp.", citations: [] } },
  {
    type: "data-claims",
    data: [{ text: "Tingkat Risiko Awal: Tinggi. Ada biaya onboarding.", confidence: 0.9, riskLevel: "tinggi" }],
  },
  {
    type: "data-salary-benefit",
    data: { title: "Kewajaran Gaji dan Benefit", status: "Tidak Wajar", summary: "Gaji terlalu tinggi untuk magang.", highlights: ["Rp9 juta/bulan"], hint: "Bandingkan dengan UMR." },
  },
  { type: "data-risks", data: [{ type: "payment_request", description: "Diminta biaya onboarding.", evidence: "biaya onboarding 250 ribu" }] },
  { type: "data-checks", data: [{ label: "Domain email", status: "warning", detail: "Memakai email gratis." }] },
  { type: "data-explanation", data: [{ title: "Mengapa berbahaya", explanation: "Perekrut resmi tidak memungut biaya." }] },
  { type: "data-references", data: [{ title: "Cek lowongan palsu", url: "https://www.kemnaker.go.id/info", snippet: "Panduan resmi.", citations: [] }] },
  { type: "data-actions", data: { actions: [{ id: "x", label: "Cek perusahaan" }] } },
  { type: "data-suggested-questions", data: ["Apa yang harus saya lakukan?"] },
  { type: "text", text: "Kalau kamu mau, kita bisa lanjutkan dengan investigasi spesifik." },
];

test("the analysis is exported in reading order with the verdict first", () => {
  const result = buildAnalysisExport(streamed, {
    exportedAt: NOW,
    sourceText: "Lowongan admin remote\ngaji 9 juta",
    sourceFiles: [{ mediaType: "image/png", filename: "poster.png", url: "data:image/png;base64,AAAA" }],
  })!;

  const headings = [...result.markdown.matchAll(/^#{1,3} (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, [
    "Hasil Telaah Lowongan",
    "Materi yang dianalisis",
    "Tingkat risiko: Tinggi",
    "Ringkasan lowongan",
    "Kewajaran Gaji dan Benefit",
    "Indikator mencurigakan",
    "Permintaan Biaya",
    "Pemeriksaan yang dilakukan",
    "Penjelasan",
    "Mengapa berbahaya",
    "Sumber verifikasi",
  ]);
  assert.equal(result.verdictLevel, "tinggi");
  assert.ok(result.markdown.includes("![poster.png](attachment:0)"));
  assert.ok(result.markdown.includes("> Jangan transfer uang atau kirim data pribadi dulu."));
  // The level prefix is shown as the heading, so the reason does not repeat it
  assert.ok(result.markdown.includes("Ada biaya onboarding."));
  assert.ok(!result.markdown.includes("Tingkat Risiko Awal"));
  assert.ok(result.markdown.includes("_Bukti: “biaya onboarding 250 ribu”_"));
  assert.ok(result.markdown.includes("- [Cek lowongan palsu](https://www.kemnaker.go.id/info): Panduan resmi."));
  assert.ok(result.markdown.includes("**Domain email** (Ada temuan): Memakai email gratis."));
  assert.ok(result.markdown.includes("1 pemeriksaan, 1 temuan."));
});

test("chat filler, thinking steps and UI-only parts stay out", () => {
  const { markdown } = buildAnalysisExport(streamed, { exportedAt: NOW })!;
  for (const leftover of ["Halo!", "langkah internal", "Apa yang harus saya lakukan", "Cek perusahaan", "investigasi spesifik"]) {
    assert.ok(!markdown.includes(leftover), leftover);
  }
  assert.ok(markdown.includes("bukan vonis final"));
});

test("a saved session with only the final analysis part exports the same sections", () => {
  const saved: ExportPart[] = [
    {
      type: "data-analysis",
      data: {
        conversationText: "",
        claims: [{ text: "Tingkat Risiko Awal: Sedang. Perlu verifikasi.", confidence: 0.6, riskLevel: "sedang" }],
        summary: "Ringkasan saja",
        risks: [{ type: "missing_context", description: "Alamat kantor tidak ada." }],
      },
    },
  ];

  const result = buildAnalysisExport(saved, { exportedAt: NOW })!;
  assert.equal(result.verdictLevel, "sedang");
  assert.ok(result.markdown.includes("## Tingkat risiko: Sedang"));
  assert.ok(result.markdown.includes("### Detail Tidak Lengkap"));
  assert.ok(result.markdown.includes("Ringkasan saja"));
});

test("the poster is only attached to an analysis, never to an answer or an action", () => {
  const file = [{ mediaType: "image/png", filename: "poster.png", url: "data:image/png;base64,AAAA" }];

  const answer = buildAnalysisExport([{ type: "text", text: "Biaya itu **tidak wajar**." }], { exportedAt: NOW, sourceText: "Apakah wajar?", sourceFiles: file })!;
  assert.equal(answer.title, "Jawaban TelaahKarier");
  assert.deepEqual(answer.attachments, []);
  assert.ok(answer.markdown.includes("## Pertanyaan\n\n> Apakah wajar?"));
  assert.ok(answer.markdown.includes("Biaya itu **tidak wajar**."));

  const action = buildAnalysisExport([{ type: "data-action-insight", data: { actionId: "a", title: "Cek Perusahaan", points: ["Cari **NIB** perusahaan"] } }], {
    exportedAt: NOW,
    sourceText: "Cek perusahaan",
    sourceFiles: file,
  })!;
  assert.equal(action.title, "Cek Perusahaan");
  assert.deepEqual(action.attachments, []);
  assert.ok(!action.markdown.includes("Materi"));
  assert.ok(action.markdown.includes("- Cari **NIB** perusahaan"));
});

test("an answer with nothing to export gives null", () => {
  assert.equal(buildAnalysisExport([{ type: "data-session-move", data: { previousTitle: "x" } }]), null);
  assert.equal(buildAnalysisExport([{ type: "text", text: "  " }]), null);
});

test("a long posting is cut, not pasted whole", () => {
  const { markdown } = buildAnalysisExport(streamed, { exportedAt: NOW, sourceText: "a".repeat(5000) })!;
  assert.ok(markdown.length < 4000);
  assert.ok(markdown.includes("…"));
});

test("the plain copy swaps picture lines for a note naming the file", () => {
  assert.equal(toPlainMarkdown("a\n\n![poster.png](attachment:0)\n\nb"), "a\n\n[Lampiran: poster.png]\n\nb");
});

test("inline marks: bold inside links, snake_case stays literal", () => {
  assert.deepEqual(parseInline("Cek **NIB** di [OSS](https://oss.go.id)"), [
    { text: "Cek " },
    { text: "NIB", bold: true },
    { text: " di " },
    { text: "OSS", href: "https://oss.go.id" },
  ]);
  assert.deepEqual(parseInline("file_name_final dan _miring_"), [{ text: "file_name_final dan " }, { text: "miring", italic: true }]);
  // Not a web link, so it is not made one
  assert.deepEqual(parseInline("[klik](javascript:alert(1))"), [{ text: "[klik](javascript:alert(1))" }]);
});

test("blocks: wrapped list items, quotes keep their lines, tables fall back to code", () => {
  const blocks = parseMarkdown("1. satu\n   lanjutan\n2. dua\n\n> baris 1\n>\n> baris 3\n\n| a | b |\n|---|---|");
  assert.deepEqual(blocks[0], { type: "list", ordered: true, items: [[{ text: "satu lanjutan" }], [{ text: "dua" }]] });
  assert.equal(blocks[1].type === "quote" && blocks[1].lines.length, 3);
  assert.equal(blocks[2].type, "code");
});

test("PDF text keeps what Helvetica can draw and drops the rest", () => {
  assert.equal(pdfSafe("Gaji “Rp9 juta” – tidak wajar… •"), "Gaji “Rp9 juta” – tidak wajar… •");
  assert.equal(pdfSafe("Bahaya ⚠️ → hati-hati ✅").trim(), "Bahaya -> hati-hati");
  assert.equal(pdfSafe("a b​c"), "a bc");
  assert.equal(pdfSafe("Café Ñandú"), "Café Ñandú");
});

test("the shared message names the user, and still reads well for a guest", () => {
  assert.equal(shareMessage("Siti Rahmawati"), "Analisis Lowongan untuk Siti Rahmawati, cek di sini!");
  assert.equal(shareMessage("  Siti  "), "Analisis Lowongan untuk Siti, cek di sini!");
  assert.equal(shareMessage(undefined), "Analisis Lowongan TelaahKarier, cek di sini!");
  assert.equal(shareMessage("   "), "Analisis Lowongan TelaahKarier, cek di sini!");
});

test("the PDF file name is a safe slug with the date", () => {
  const date = new Date("2026-10-22T10:00:00Z");
  assert.equal(exportFilename("Hasil Telaah Lowongan", date), "telaahkarier-hasil-telaah-lowongan-2026-10-22.pdf");
  assert.equal(exportFilename("Cek Kewajaran Gaji & Benefit!", date), "telaahkarier-cek-kewajaran-gaji-benefit-2026-10-22.pdf");
  assert.equal(exportFilename("???", date), "telaahkarier-telaah-2026-10-22.pdf");
});
