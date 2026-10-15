/**
 * Regression cases for the rule-based signals (langchain/agents/analyzer/signals.ts).
 * Every example is synthetic; none is copied from the test split.
 *
 *   pnpm test:signals
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { detectSignals, ruleBasedRiskLevel, type SignalId } from "../langchain/agents/analyzer/signals";

const ids = (text: string): SignalId[] => detectSignals(text).map((signal) => signal.id);

function fires(id: SignalId, cases: string[]) {
  for (const text of cases) {
    test(`ya: ${text.slice(0, 70).replace(/\s+/g, " ")}`, () => assert.ok(ids(text).includes(id), `${id} tidak terdeteksi`));
  }
}

function silent(id: SignalId, cases: string[]) {
  for (const text of cases) {
    test(`tidak: ${text.slice(0, 70).replace(/\s+/g, " ")}`, () =>
      assert.ok(!ids(text).includes(id), `${id} salah terdeteksi: ${JSON.stringify(detectSignals(text).find((s) => s.id === id)?.evidence)}`)
    );
  }
}

describe("fee_request: transfer gaya surat, biaya diganti, dana talangan", () => {
  fires("fee_request", [
    "Untuk registrasi swab dapat melakukan transfer ke Rekening Bank Permata 8500000000000000 a/n PANITIA SELEKSI sebesar Rp. 100.000.",
    "Mohon selesaikan pembayaran melalui transfer. Transfer ke:\n\nBANK JAGO A/N. BUDI S\n\nNO REK: 1003-0000-0000\n\nTotal : Rp 3.920.887",
    "Silakan setor ke rekening BRI a/n panitia rekrutmen sebelum jadwal tes.",
    "Untuk biayanya bisa di tf kan ke layanan penerimaan data agar segera diproses.",
    "Ada biaya sementara 50 rb untuk pembuatan surat formalitas.",
    "Biaya formulir Rp 50.000 dibayar saat pengambilan berkas.",
    "Akomodasi dan tiket pesawat ditanggung terlebih dahulu oleh peserta, kemudian akan diganti setelah tes.",
    "Tiket keberangkatan akan direimburse oleh perusahaan setelah peserta tiba di lokasi tes.",
    "Pilihan pertama: biaya transport ditanggung sendiri dan akan diganti perusahaan.",
    "Tiket pesawat kami bantu dengan dana talangan dulu, nanti dipotong gaji bulan pertama.",
    "Wajib bayar biaya modul onboarding Rp 150.000 sebelum mulai kerja.",
  ]);

  silent("fee_request", [
    "Proses rekrutmen tidak dipungut biaya apa pun.",
    "Tidak dipungut biaya pendaftaran maupun biaya pelatihan.",
    "PENDAFTARAN GRATIS! Tanpa biaya pendaftaran.",
    "Biaya akomodasi dan tiket selama tes ditanggung perusahaan.",
    "Biaya pelatihan ditanggung oleh perusahaan sepenuhnya.",
    "Gaji ditransfer ke rekening BCA setiap tanggal 25.",
    "Tanggung jawab: melakukan transfer ke rekening vendor dan rekonsiliasi bank harian.",
    "Iuran BPJS dipotong dari gaji sesuai ketentuan.",
    "Biaya perjalanan dinas akan diganti sesuai kebijakan perusahaan.",
    "Benefit: uang transport, uang makan, dan uang lembur.",
    "Gaji Rp 5.000.000, tunjangan transport Rp 500.000 per bulan.",
    "Tiket Keberangkatan : ditanggung oleh Pekerja Migran Indonesia",
    "Apakah wajar recruiter meminta transfer ke rekening pribadi?",
  ]);
});

describe("link_in_bio: kanal pendaftaran tidak terlihat", () => {
  fires("link_in_bio", [
    "Daftar sekarang, klik link di bio!",
    "Informasi lengkap dan cara pendaftaran: website yang ada di bio profil.",
    "Info pendaftaran cek linkinbio ya kak",
    "Pendaftaran dibuka, silakan klik daftar 👇",
    "Kirim CV ke hrd.lowongan@gmail.com atau daftar lewat link di bio.",
  ]);

  silent("link_in_bio", [
    "Daftar di https://karir.contoh.co.id. Info juga ada di link bio kami.",
    "Lamar melalui www.contoh-karir.com atau link di bio.",
    "Biodata lengkap dikirim bersama CV.",
  ]);

  test("link di bio saja tidak pernah menghasilkan rendah atau tinggi", () => {
    assert.equal(ruleBasedRiskLevel(detectSignals("Lowongan admin, daftar lewat link di bio")), "sedang");
  });
});

describe("unofficial_domain: hosting gratis/domain sekali pakai", () => {
  fires("unofficial_domain", [
    "Daftar di https://rekrutmen-bumn-2026.vercel.app/daftar sekarang juga",
    "Formulir: loker-pln.netlify.app",
    "Pendaftaran online: rekrutmenpertamina.my.id",
    "Link resmi: https://karir-indomaret.site/form",
    "Daftar di bersama-bumn.xyz",
    "Info lengkap: sidji.me/lokerresmi",
    "Klik msha.ke/rekrutmen2026",
    "Lamar di https://career-alfamart.it.com",
  ]);

  silent("unofficial_domain", [
    "Lamar di https://karir.bca.co.id",
    "Pendaftaran secara online melalui situs resmi.",
    "Tes online dilaksanakan 12 Oktober.",
    "Informasi di https://rekrutmen.bumn.go.id",
    "Kirim CV ke recruitment@contoh.co.id",
  ]);
});

describe("paid_task: tugas like/follow/subscribe berbayar", () => {
  fires("paid_task", [
    "Kami membutuhkan banyak freelance untuk mengerjakan tugas LIKE dan SUBSCRIBE channel YouTube.",
    "Cukup like dan follow akun toko, dibayar Rp 10.000 per tugas.",
    "Komisi Rp 50.000 setiap subscribe channel klien.",
    "Penghasilan dijamin Rp 300 ribu per hari.",
    "Kerja dari HP saja, bisa dapat 500rb per hari.",
  ]);

  silent("paid_task", [
    "Melakukan follow up pelanggan dan mencatat hasil penjualan.",
    "Mengelola akun media sosial dan meningkatkan jumlah follower.",
    "We would like to invite fresh graduates to apply.",
    "Gaji harian Rp 150.000, lembur dihitung terpisah.",
    "Kami tidak pernah menawarkan tugas like atau subscribe berbayar.",
  ]);
});

describe("institution_impersonation: klaim instansi/BUMN/Tbk dengan kontak pribadi", () => {
  fires("institution_impersonation", [
    "Rekrutmen Tenaga Ahli DPR RI 2026. Kirim CV ke rekrutmen.tenagaahli@gmail.com",
    "Lowongan PT Pertamina (Persero). Hubungi WA 0812-3456-7890 untuk mendaftar.",
    "Program magang Kementerian Ketenagakerjaan, daftar via wa.me/6281234567890",
    "PT Contoh Makmur Tbk membuka lowongan. Lamaran ke hrd.contohmakmur@yahoo.com",
  ]);

  silent("institution_impersonation", [
    "Toko Roti Maju membuka lowongan kasir. Kirim CV ke tokorotimaju@gmail.com atau WA 0812-3456-7890.",
    "PT Bank Contoh (Persero) Tbk membuka rekrutmen. Lamar di https://e-recruitment.contoh.co.id",
    "PT Duta Penempatan (P3MI), No SIP B.123/SIP2MI/2026, terdaftar di Kementerian P2MI. Email: dutapenempatan@gmail.com Telepon: 0812-3456-7890",
    "Waspada penipuan mengatasnamakan BUMN lewat WhatsApp. Rekrutmen resmi hanya di situs kami.",
  ]);
});

describe("moderate_combination dan kasus yang wajar tetap sedang", () => {
  test("WA pribadi + shortlink: tinggi", () => {
    const signals = detectSignals("Hubungi WA 0812 3456 7890. Formulir pendaftaran: bit.ly/lokerkasir");
    assert.ok(signals.some((signal) => signal.id === "moderate_combination"));
    assert.equal(ruleBasedRiskLevel(signals), "tinggi");
  });

  test("email gratis + link di bio: tinggi", () => {
    assert.equal(ruleBasedRiskLevel(detectSignals("Kirim CV ke lokerkasir@gmail.com, info lengkap klik link di bio")), "tinggi");
  });

  const stillSedang = [
    // Two contact signals of the same kind (a small business or licensed agency).
    "Rumah Makan Sederhana butuh pelayan. WA 0812-3456-7890, email rmsederhana@gmail.com",
    "Lowongan staf gudang, formulir di https://bit.ly/stafgudang",
    "Puskesmas Sukamaju membutuhkan perawat. Hubungi 0812-3456-7890.",
    "Dicari admin online, gaji 15 juta per bulan.",
  ];
  for (const text of stillSedang) {
    test(`tetap sedang: ${text}`, () => assert.equal(ruleBasedRiskLevel(detectSignals(text)), "sedang"));
  }
});
