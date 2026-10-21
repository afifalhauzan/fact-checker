/**
 * Matching check for "sudah ditelaah sebelumnya" (design doc 7.2), run against the seed posts in
 * a local database (php artisan db:seed --class=TelaahSeeder; the seed file carries the embeddings).
 * Never seed production: TelaahBareng starts empty there.
 * Synthetic queries only, never the test split. Reports, per query, the best candidate's cosine
 * and whether it would be offered, then precision, recall, and the official-posting false referrals.
 *
 *   pnpm eval:similar
 */
import "dotenv/config";
import { backendFetch, internalKeyHeader } from "../lib/server-auth";
import { embedText, embeddingTextFor } from "../langchain/agents/telaah-bersama/embeddings";
import { toMaterialLines } from "../langchain/agents/telaah-bersama/share-payload";
import { COSINE_THRESHOLD, materialFeatures, pickBestMatch, type SimilarCandidate } from "../langchain/agents/telaah-bersama/similar";

type Expectation = { kind: "match"; titleStartsWith: string } | { kind: "official" } | { kind: "unrelated" };

const QUERIES: Array<{ name: string; text: string; expect: Expectation }> = [
  {
    name: "same letter, number spelled differently",
    expect: { kind: "match", titleStartsWith: "Lowongan PT Listrik Nusantara" },
    text: "Undangan tes wawancara PT Listrik Nusantara. Harap konfirmasi ke WA +62 812 0000 4471 dan transfer biaya akomodasi.",
  },
  {
    name: "same letter reworded, no contacts",
    expect: { kind: "match", titleStartsWith: "Lowongan PT Listrik Nusantara" },
    text: "SURAT UNDANGAN TES TAHAP 2\nPT Listrik Nusantara (Persero) mengundang Saudara mengikuti tes wawancara posisi Staff Admin penempatan Jakarta.\nPeserta wajib memesan akomodasi melalui Citra Wisata Travel sebesar Rp1.350.000 sebelum tes.\nPeriode rekrutmen 1-30 Oktober 2026.",
  },
  {
    name: "like & follow task reworded",
    expect: { kind: "match", titleStartsWith: "Kerja Paruh Waktu Like" },
    text: "Halo kak, ada kerja sampingan dari HP, cuma like dan follow akun, per tugas dibayar 15rb. Penghasilan bisa 500rb sampai 2 juta sehari. Gabung grup Telegram untuk tugas berikutnya, ada tugas prabayar deposit 100rb komisi 30%.",
  },
  {
    name: "Bangkok operator reworded",
    expect: { kind: "match", titleStartsWith: "Operator Komputer" },
    text: "Dicari operator komputer untuk kerja di Bangkok Thailand, gaji 9 sampai 12 juta tanpa pengalaman. Paspor, tiket, dan visa diurus sponsor. Berangkat pakai visa kunjungan dulu, izin kerja diurus setelah sampai. Hubungi 0857 0000 3310.",
  },
  {
    name: "fake internship, same site",
    expect: { kind: "match", titleStartsWith: "Program Magang Nasional" },
    text: "Pendaftaran Program Magang Nasional Batch 2 dibuka! Daftar di pendaftaran-magangnasional.example, biaya administrasi Rp250.000.",
  },
  {
    name: "official PLN posting",
    expect: { kind: "official" },
    text: "PT Listrik Nusantara (Persero) membuka rekrutmen Staff Admin penempatan Jakarta. Pendaftaran hanya melalui karier.listriknusantara.co.id. Seluruh proses rekrutmen tidak dipungut biaya apa pun.",
  },
  {
    name: "official internship",
    expect: { kind: "official" },
    text: "Program Magang Nasional Batch 2 Tahun 2026 dibuka. Pendaftaran gratis melalui magangnasional.kemnaker.go.id hingga 25 Oktober 2026.",
  },
  {
    name: "barista",
    expect: { kind: "unrelated" },
    text: "Dibutuhkan barista Kopi Senja Malang, gaji 2,8 juta, shift pagi/sore. Kirim CV ke WA 0896-0000-1188.",
  },
  {
    name: "bank management trainee",
    expect: { kind: "unrelated" },
    text: "PT Bank Sentosa membuka Management Trainee 2026 untuk lulusan S1 semua jurusan. Daftar melalui karier.banksentosa.co.id.",
  },
  {
    name: "warehouse staff",
    expect: { kind: "unrelated" },
    text: "Lowongan staff gudang PT Logistik Prima di Cikarang, lulusan SMA/SMK. Kirim lamaran ke hrd@logistikprima.example sebelum 30 November 2026.",
  },
  {
    name: "cashier at a named store",
    expect: { kind: "unrelated" },
    text: "Toko Sumber Rejeki Surabaya mencari kasir, lulusan SMA, gaji UMR. Datang langsung ke Jl. Mawar 12 membawa CV.",
  },
];

async function candidatesFor(text: string): Promise<SimilarCandidate[]> {
  const features = materialFeatures(text);
  const embedding = await embedText(embeddingTextFor(toMaterialLines(text)));
  const response = await backendFetch("/telaah-bersama/similar", {
    method: "POST",
    headers: internalKeyHeader(),
    body: JSON.stringify({ embedding, identifiers: features.identifiers }),
  });
  if (!response.ok) throw new Error(`similar returned ${response.status}`);
  return (await response.json()).data;
}

async function main() {
  let truePositives = 0;
  let offered = 0;
  let officialReferrals = 0;
  const expectedMatches = QUERIES.filter((query) => query.expect.kind === "match").length;

  for (const query of QUERIES) {
    const candidates = await candidatesFor(query.text);
    const best = [...candidates].sort((a, b) => (b.cosine ?? 0) - (a.cosine ?? 0))[0];
    const match = pickBestMatch(candidates, materialFeatures(query.text));

    let verdict = "ok";
    if (match) offered += 1;
    if (query.expect.kind === "match") {
      const correct = !!match && match.post.title.startsWith(query.expect.titleStartsWith);
      if (correct) truePositives += 1;
      else verdict = "MISS";
    } else if (match) {
      verdict = "WRONG";
      if (query.expect.kind === "official") officialReferrals += 1;
    }

    console.log(
      `${verdict.padEnd(5)} ${query.name.padEnd(42)} top cosine ${best?.cosine?.toFixed(3) ?? " n/a "} ` +
        `→ ${match ? `#${match.post.id} (${match.reasons.join(", ")})` : "no card"}`
    );
  }

  console.log(`\nThreshold: cosine ≥ ${COSINE_THRESHOLD}, or a shared contact with cosine ≥ 0.6`);
  console.log(`Precision: ${offered ? (truePositives / offered).toFixed(2) : "n/a"} (${truePositives}/${offered} cards correct)`);
  console.log(`Recall: ${(truePositives / expectedMatches).toFixed(2)} (${truePositives}/${expectedMatches})`);
  console.log(`Official postings referred to a fake one: ${officialReferrals} (target 0)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
