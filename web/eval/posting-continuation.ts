/**
 * Small labeled check for classifyNewMaterial (design doc 6.11 and 7.1): later stages of the same
 * posting must stay in the session; a clearly different posting should be flagged. Calls the real
 * model, on synthetic cases only (never the test split).
 *
 *   pnpm eval:continuation
 */
import "dotenv/config";
import { classifyNewMaterial } from "../langchain/agents/analyzer/turn-router";
import type { PostingContext } from "../langchain/agents/analyzer/conversation-context";

const SESSIONS = {
  pln: {
    postingText:
      "SURAT PANGGILAN TES TAHAP II. PT Listrik Nusantara (Persero) mengundang Saudara untuk tes wawancara posisi Staff Admin, penempatan Jakarta. Peserta wajib reservasi akomodasi melalui Citra Wisata Travel sebesar Rp1.350.000.",
    summary: "Surat panggilan tes Staff Admin PT Listrik Nusantara yang meminta biaya akomodasi lewat agen travel.",
  },
  tugas: {
    postingText: "Halo kak, kami membuka kerja paruh waktu. Cukup like & follow akun, 1 tugas dibayar Rp15.000. Gabung grup Telegram untuk tugas berikutnya.",
    summary: "Tawaran kerja paruh waktu like dan follow berbayar per tugas lewat WhatsApp dan Telegram.",
  },
  bangkok: {
    postingText: "DIBUTUHKAN OPERATOR KOMPUTER DI BANGKOK. Gaji 9-12 juta tanpa pengalaman. Tiket, paspor, visa diurus sponsor. Berangkat pakai visa kunjungan.",
    summary: "Lowongan operator komputer di Bangkok dengan visa kunjungan, semua dokumen diurus sponsor.",
  },
  kasir: {
    postingText: "LOKER KASIR MINIMARKET SURABAYA. Lulusan SMA/SMK usia 18-25. Pendaftaran dibuka 5-20 Oktober 2026.",
    summary: "Lowongan kasir minimarket di Surabaya tanpa nama usaha.",
  },
} as const;

const CASES: Array<{ session: keyof typeof SESSIONS; material: string; isNewPosting: boolean }> = [
  { session: "pln", isNewPosting: false, material: "Selamat, Anda lolos seleksi administrasi. Silakan hadir pada tes wawancara tanggal 25 Oktober 2026 di Hotel Mawar Jakarta. Mohon konfirmasi kehadiran." },
  { session: "tugas", isNewPosting: false, material: "Kak, tugas selanjutnya tugas prabayar ya. Deposit 200rb dulu nanti cair 260rb, komisi langsung masuk." },
  { session: "bangkok", isNewPosting: false, material: "Ini kontrak kerjanya kak. Posisi customer service, gaji 1000 USD, tiket ditanggung, berangkat lewat Jakarta tanggal 5 November." },
  { session: "kasir", isNewPosting: false, material: "Formulir pendaftaran: nama lengkap, upload foto KTP, selfie memegang KTP, nama ibu kandung." },
  { session: "pln", isNewPosting: false, material: "Bukti transfer ke Citra Wisata Travel Rp1.350.000 sudah saya kirim, tapi adminnya minta tambahan biaya seragam." },
  { session: "pln", isNewPosting: true, material: "Dibutuhkan barista Kopi Senja Malang, gaji 2,8 juta, shift pagi/sore. Kirim CV ke WA 0896-0000-1188." },
  { session: "tugas", isNewPosting: true, material: "PT Bank Sentosa membuka Management Trainee 2026 untuk lulusan S1 semua jurusan. Daftar melalui situs karier resmi bank." },
  { session: "bangkok", isNewPosting: true, material: "Dicari driver ojek online area Bandung. Daftar lewat aplikasi, bawa SIM C dan STNK." },
  { session: "kasir", isNewPosting: true, material: "Lowongan staff gudang PT Logistik Prima di Cikarang. Kirim lamaran ke hrd@logistikprima.example sebelum 30 November 2026." },
];

async function main() {
  let falseWarnings = 0;
  let missed = 0;

  for (const testCase of CASES) {
    const session = SESSIONS[testCase.session];
    const context: PostingContext = {
      postingText: session.postingText,
      images: [],
      analysis: { summary: session.summary },
      analysisIndex: 0,
    };
    const decision = await classifyNewMaterial({ materialText: testCase.material, context });
    const correct = decision.isNewPosting === testCase.isNewPosting;
    if (!correct && !testCase.isNewPosting) falseWarnings += 1;
    if (!correct && testCase.isNewPosting) missed += 1;
    console.log(`${correct ? "ok  " : "MISS"} ${testCase.session.padEnd(8)} expected ${testCase.isNewPosting ? "baru" : "lanjutan"}, got ${decision.isNewPosting ? "baru" : "lanjutan"} (${decision.reason})`);
  }

  const same = CASES.filter((item) => !item.isNewPosting).length;
  const different = CASES.length - same;
  console.log(`\nFalse warnings on the same posting: ${falseWarnings}/${same}`);
  console.log(`Different postings not flagged: ${missed}/${different}`);
  process.exitCode = falseWarnings > 0 ? 1 : 0;
}

void main();
