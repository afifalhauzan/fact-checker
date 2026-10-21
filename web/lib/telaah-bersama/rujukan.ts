import type { TelaahModus } from "./mock-data";

// Prototype content for the Rujukan page (design doc 06, halaman Rujukan). Every number and link must be
// checked against the institution's own site before release; `verified` stays false until then.

export interface RujukanChannel {
  name: string;
  institution: string;
  contact?: string;
  url?: string;
  prepare?: string;
  verified: boolean;
}

export interface RujukanSituation {
  id: string;
  title: string;
  description: string;
  steps: string[];
  channels: RujukanChannel[];
}

export const SITUATIONS: RujukanSituation[] = [
  {
    id: "sudah-transfer",
    title: "Saya sudah transfer uang",
    description: "Biaya pendaftaran, seragam, pelatihan, akomodasi, atau deposit tugas.",
    steps: [
      "Hubungi bank atau e-wallet pengirim secepatnya dan minta pemblokiran rekening tujuan.",
      "Simpan bukti transfer, nomor rekening tujuan, dan seluruh percakapan.",
      "Jangan menuruti permintaan transfer lanjutan dengan alasan apa pun, termasuk \"biaya penarikan\".",
    ],
    channels: [
      {
        name: "Call center bank atau e-wallet pengirim",
        institution: "Bank / penyedia e-wallet",
        prepare: "Bukti transfer, nomor rekening tujuan, waktu transaksi",
        verified: false,
      },
      {
        name: "Indonesia Anti-Scam Centre (IASC)",
        institution: "Otoritas Jasa Keuangan",
        contact: "Kontak OJK 157",
        url: "https://www.ojk.go.id",
        prepare: "Bukti transfer, identitas pelapor, kronologi",
        verified: false,
      },
    ],
  },
  {
    id: "data-pribadi",
    title: "Saya sudah mengirim KTP, swafoto, atau kode OTP",
    description: "Data pribadi bisa dipakai untuk pinjaman online atau mengambil alih akun.",
    steps: [
      "Jika mengirim OTP atau PIN: segera ganti kata sandi dan PIN akun yang terkait, lalu hubungi penyedia akunnya.",
      "Pantau pengajuan pinjaman atas namamu dan laporkan jika ada yang tidak kamu ajukan.",
      "Simpan bukti kepada siapa data itu dikirim.",
    ],
    channels: [
      {
        name: "Layanan konsumen OJK",
        institution: "Otoritas Jasa Keuangan",
        contact: "Kontak OJK 157",
        url: "https://www.ojk.go.id",
        verified: false,
      },
      {
        name: "Patroli Siber",
        institution: "Bareskrim Polri",
        url: "https://patrolisiber.id",
        prepare: "Tangkapan layar percakapan, nomor atau akun pelaku",
        verified: false,
      },
    ],
  },
  {
    id: "luar-negeri",
    title: "Saya ditawari kerja ke luar negeri, atau sudah di sana",
    description: "Tawaran dengan visa kunjungan, tanpa perusahaan penempatan resmi, atau negara tujuan yang dilarang.",
    steps: [
      "Cek perusahaan penempatan (P3MI) di SISKOP2MI sebelum menyerahkan paspor atau dokumen apa pun.",
      "Jangan berangkat dengan visa kunjungan atau umrah untuk bekerja.",
      "Jika sudah di luar negeri dan merasa tidak aman, hubungi perwakilan RI terdekat.",
    ],
    channels: [
      {
        name: "Call center KP2MI",
        institution: "Kementerian Pelindungan Pekerja Migran Indonesia",
        contact: "08001000",
        url: "https://siskop2mi.bp2mi.go.id",
        verified: false,
      },
      {
        name: "Peduli WNI",
        institution: "Kementerian Luar Negeri",
        url: "https://peduliwni.kemlu.go.id",
        prepare: "Lokasi, identitas, dan kontak keluarga di Indonesia",
        verified: false,
      },
    ],
  },
  {
    id: "lowongan-palsu",
    title: "Saya menemukan lowongan palsu",
    description: "Lowongan yang mencatut perusahaan atau instansi, atau masih beredar di media sosial.",
    steps: [
      "Laporkan unggahan atau akunnya lewat fitur lapor di platform tempat kamu menemukannya.",
      "Bagikan ke Telaah Bersama supaya orang lain yang menerimanya bisa waspada.",
    ],
    channels: [
      {
        name: "Posko pengaduan lowongan kerja",
        institution: "Kementerian Ketenagakerjaan",
        contact: "1500 630",
        url: "https://kemnaker.go.id",
        verified: false,
      },
      {
        name: "Aduan konten",
        institution: "Kementerian Komunikasi dan Digital",
        url: "https://aduankonten.id",
        prepare: "Link unggahan atau akun, tangkapan layar",
        verified: false,
      },
    ],
  },
];

export interface CheckTool {
  name: string;
  institution: string;
  use: string;
  url: string;
  verified: boolean;
}

export const CHECK_TOOLS: CheckTool[] = [
  { name: "AHU Online", institution: "Kementerian Hukum", use: "Cek legalitas badan usaha berbentuk PT.", url: "https://ahu.go.id", verified: false },
  {
    name: "SISKOP2MI",
    institution: "KP2MI",
    use: "Cek perusahaan penempatan pekerja migran (P3MI) dan lowongan luar negeri resmi.",
    url: "https://siskop2mi.bp2mi.go.id",
    verified: false,
  },
  {
    name: "Karirhub",
    institution: "Kementerian Ketenagakerjaan",
    use: "Pembanding lowongan resmi yang terdaftar.",
    url: "https://karirhub.kemnaker.go.id",
    verified: false,
  },
  { name: "Cek Rekening", institution: "Komdigi", use: "Cek apakah rekening atau nomor pernah dilaporkan.", url: "https://cekrekening.id", verified: false },
  { name: "Daftar pinjol berizin", institution: "OJK", use: "Pastikan aplikasi pinjaman yang menghubungimu berizin.", url: "https://www.ojk.go.id", verified: false },
];

export interface FactChecker {
  name: string;
  url: string;
  domain: string;
}

// Indonesian IFCN signatories named in the literature; current status must be checked on the IFCN site.
export const FACT_CHECKERS: FactChecker[] = [
  { name: "TurnBackHoax (MAFINDO)", url: "https://turnbackhoax.id", domain: "turnbackhoax.id" },
  { name: "Cek Fakta Tempo", url: "https://cekfakta.tempo.co", domain: "cekfakta.tempo.co" },
  { name: "Cek Fakta Kompas.com", url: "https://www.kompas.com/cekfakta", domain: "kompas.com" },
  { name: "Cek Fakta Liputan6", url: "https://www.liputan6.com/cek-fakta", domain: "liputan6.com" },
  { name: "Tirto.id", url: "https://tirto.id", domain: "tirto.id" },
  { name: "Cek Fakta Suara.com", url: "https://www.suara.com/cekfakta", domain: "suara.com" },
];

export interface FactCheckResult {
  title: string;
  source: string;
  date: string;
  keywords: string[];
}

// shortcut: canned results for the prototype; the real search calls Tavily with include_domains = FACT_CHECKERS.
export const MOCK_FACT_CHECKS: FactCheckResult[] = [
  {
    title: "[SALAH] Surat panggilan tes BUMN yang meminta transfer biaya akomodasi ke agen travel",
    source: "turnbackhoax.id",
    date: "2026-09-18",
    keywords: ["bumn", "listrik", "travel", "akomodasi", "surat panggilan", "staff admin"],
  },
  {
    title: "Cek Fakta: Lowongan kerja paruh waktu like dan follow berujung deposit",
    source: "liputan6.com",
    date: "2026-08-02",
    keywords: ["like", "follow", "paruh waktu", "deposit", "tugas", "telegram"],
  },
  {
    title: "[HOAKS] Pendaftaran program magang nasional berbayar mengatasnamakan kementerian",
    source: "turnbackhoax.id",
    date: "2026-10-01",
    keywords: ["magang", "kementerian", "pendaftaran", "biaya administrasi"],
  },
  {
    title: "Waspada tawaran kerja operator komputer di Thailand dan Kamboja",
    source: "kompas.com",
    date: "2026-07-21",
    keywords: ["thailand", "kamboja", "operator", "luar negeri", "visa"],
  },
];

const SITUATION_BY_MODUS: Record<TelaahModus, string> = {
  biaya: "sudah-transfer",
  tugas_deposit: "sudah-transfer",
  data_sensitif: "data-pribadi",
  tppo: "luar-negeri",
  impersonasi: "lowongan-palsu",
  lainnya: "lowongan-palsu",
};

/** The Rujukan section most relevant to a Telaah, linked from its detail page. */
export function rujukanHrefFor(modus: TelaahModus): string {
  return `/rujukan#${SITUATION_BY_MODUS[modus]}`;
}
