import type { RiskType } from "@/langchain/agents/analyzer/schema";

// Prototype data for the Telaah Bersama UX mockup (docs/wiki/ai/06-DESAIN-TELAAH-BERSAMA.md).
// Every company, number, account, and domain here is fictitious.

export type TelaahRiskLevel = "sedang" | "tinggi";

export type TelaahModus = "biaya" | "tugas_deposit" | "data_sensitif" | "tppo" | "impersonasi" | "lainnya";

export type ContactKind = "phone" | "email" | "account" | "domain";

export type ReportType = "data_pribadi" | "spam" | "lowongan_asli";

export interface TelaahContact {
  kind: ContactKind;
  value: string;
}

export interface TelaahEvidence {
  type: RiskType;
  description: string;
  evidence?: string;
}

export interface TelaahAttachment {
  id: string;
  label: string;
  variant: "poster" | "chat";
  // A real image the user re-uploaded; seed attachments are drawn placeholders instead.
  url?: string;
  // Set when the transcript of this image matched a personal-data pattern.
  sensitiveWarning?: string;
}

export interface TelaahComment {
  id: string;
  author: string;
  isNewAccount: boolean;
  body: string;
  flag?: "klaim_tanpa_bukti";
  createdAt: string;
}

export interface TelaahPost {
  id: number;
  title: string;
  riskLevel: TelaahRiskLevel;
  claim: string;
  modus: TelaahModus;
  company?: string;
  position?: string;
  location?: string;
  salary?: string;
  openDate?: string;
  closeDate?: string;
  source: { platform: string; account?: string };
  contacts: TelaahContact[];
  summary: string;
  evidence: TelaahEvidence[];
  materialLines: string[];
  story?: string;
  links: string[];
  attachments: TelaahAttachment[];
  author: string;
  createdAt: string;
  analyzedAt: string;
  reactionCount: number;
  matchCount: number;
  spamReports: number;
  asliResponses: { count: number; reasons: string[] };
  comments: TelaahComment[];
  isSeed: boolean;
}

export const MODUS_LABELS: Record<TelaahModus, string> = {
  biaya: "Permintaan biaya",
  tugas_deposit: "Tugas berbayar / deposit",
  data_sensitif: "Permintaan data pribadi",
  tppo: "Kerja luar negeri",
  impersonasi: "Mencatut instansi",
  lainnya: "Kontak mencurigakan",
};

export const CONTACT_LABELS: Record<ContactKind, string> = {
  phone: "Nomor WA/HP",
  email: "Email",
  account: "Rekening tujuan",
  domain: "Domain/link",
};

export const SOURCE_PLATFORMS = ["Instagram", "WhatsApp", "Telegram", "Facebook", "TikTok", "Website", "Lainnya"];

export const CURRENT_USER = "Pencari Kerja #7c2";

export const posts: TelaahPost[] = [
  {
    id: 128,
    title: "Lowongan PT Listrik Nusantara (Persero) · Staff Admin · Jakarta · 1–30 Okt 2026",
    riskLevel: "tinggi",
    claim:
      "Tingkat Risiko Awal: Tinggi. Surat panggilan tes meminta peserta mentransfer biaya akomodasi ke agen travel yang ditunjuk, padahal rekrutmen resmi tidak memungut biaya.",
    modus: "biaya",
    company: "PT Listrik Nusantara (Persero)",
    position: "Staff Admin",
    location: "Jakarta",
    openDate: "2026-10-01",
    closeDate: "2026-10-30",
    source: { platform: "Instagram", account: "@rekrutmen.bumn.terbaru" },
    contacts: [
      { kind: "phone", value: "0812-0000-4471" },
      { kind: "account", value: "BRI 0000-01-778899-50-1 a.n. Citra Wisata Travel" },
      { kind: "domain", value: "karier-listriknusantara.example" },
    ],
    summary:
      "Surat panggilan tes tahap 2 untuk posisi Staff Admin. Peserta diminta memesan akomodasi dan tiket lewat agen travel tertentu dengan transfer Rp1.350.000 sebelum tes.",
    evidence: [
      {
        type: "payment_request",
        description: "Peserta diminta membayar akomodasi dan tiket melalui agen travel yang ditunjuk panitia.",
        evidence: "wajib melakukan reservasi melalui Citra Wisata Travel sebesar Rp1.350.000",
      },
      {
        type: "suspicious_contact",
        description: "Konfirmasi kehadiran hanya lewat WhatsApp pribadi, bukan email berdomain perusahaan.",
        evidence: "konfirmasi kehadiran ke WA 0812-0000-4471",
      },
    ],
    materialLines: [
      "SURAT PANGGILAN TES TAHAP II",
      "PT Listrik Nusantara (Persero) mengundang Saudara untuk mengikuti tes wawancara",
      "Posisi: Staff Admin · Penempatan: Jakarta",
      "Periode rekrutmen: 1 Oktober 2026 – 30 Oktober 2026",
      "Peserta wajib melakukan reservasi melalui Citra Wisata Travel sebesar Rp1.350.000",
      "Transfer ke BRI 0000-01-778899-50-1 a.n. Citra Wisata Travel",
      "Konfirmasi kehadiran ke WA 0812-0000-4471 paling lambat 2x24 jam",
      "Info lengkap: karier-listriknusantara.example/tahap-2",
    ],
    story:
      "Saya melamar lewat link di bio akun Instagram itu, lalu 3 hari kemudian dapat surat ini lewat email Gmail. Saya belum transfer.",
    links: ["https://karier-listriknusantara.example/tahap-2"],
    attachments: [{ id: "a1", label: "Surat panggilan tes", variant: "poster" }],
    author: "Pencari Kerja #a3f",
    createdAt: "2026-10-12T09:20:00+07:00",
    analyzedAt: "2026-10-12T09:12:00+07:00",
    reactionCount: 23,
    matchCount: 41,
    spamReports: 0,
    asliResponses: { count: 0, reasons: [] },
    isSeed: true,
    comments: [
      {
        id: "c1",
        author: "Pencari Kerja #19b",
        isNewAccount: false,
        body: "Saya juga dapat surat yang sama, nomor WA-nya sama persis. Waktu saya tanya, adminnya maksa transfer hari itu juga.",
        createdAt: "2026-10-13T20:05:00+07:00",
      },
      {
        id: "c2",
        author: "Pencari Kerja #e80",
        isNewAccount: false,
        body: "Di situs resmi perusahaannya ada pengumuman bahwa seluruh proses rekrutmen tidak dipungut biaya apa pun.",
        createdAt: "2026-10-14T08:41:00+07:00",
      },
      {
        id: "c3",
        author: "Pencari Kerja #d51",
        isNewAccount: true,
        body: "Aman kok, saya sudah ikut dan sekarang sudah kerja di sana. Transfer saja biar cepat.",
        flag: "klaim_tanpa_bukti",
        createdAt: "2026-10-15T23:12:00+07:00",
      },
      {
        id: "c4",
        author: "Pencari Kerja #5aa",
        isNewAccount: false,
        body: "Teman saya sudah terlanjur transfer, sekarang nomornya tidak bisa dihubungi.",
        createdAt: "2026-10-17T11:30:00+07:00",
      },
    ],
  },
  {
    id: 131,
    title: "Kerja Paruh Waktu Like & Follow · Admin Online · Remote · Okt 2026",
    riskLevel: "tinggi",
    claim:
      "Tingkat Risiko Awal: Tinggi. Pola tugas like dan follow berbayar yang berlanjut ke permintaan deposit untuk 'tugas prabayar', modus yang sama dengan sindikat yang dibongkar Bareskrim.",
    modus: "tugas_deposit",
    position: "Admin Online",
    location: "Remote",
    salary: "Rp15.000 per tugas",
    openDate: "2026-10-05",
    source: { platform: "WhatsApp", account: "Pesan berantai dari nomor tidak dikenal" },
    contacts: [
      { kind: "phone", value: "+62 812-0000-9921" },
      { kind: "domain", value: "t.me/tugasharian_resmi" },
    ],
    summary:
      "Tawaran kerja paruh waktu: like dan follow akun media sosial dibayar Rp15.000 per tugas. Setelah tiga tugas, peserta diajak masuk grup Telegram dan ditawari tugas prabayar dengan deposit Rp100.000.",
    evidence: [
      {
        type: "payment_request",
        description: "Ada permintaan deposit untuk membuka tugas dengan komisi lebih besar.",
        evidence: "tugas prabayar cukup deposit Rp100.000 komisi 30%",
      },
      {
        type: "overclaim",
        description: "Penghasilan dijanjikan tinggi untuk pekerjaan yang sangat ringan.",
        evidence: "penghasilan 500rb–2jt per hari hanya dari HP",
      },
    ],
    materialLines: [
      "Halo kak, kami dari tim pemasaran digital sedang membuka kerja paruh waktu",
      "Cukup like & follow akun, 1 tugas dibayar Rp15.000",
      "Penghasilan 500rb–2jt per hari hanya dari HP",
      "Gabung grup Telegram t.me/tugasharian_resmi untuk tugas berikutnya",
      "Tugas prabayar cukup deposit Rp100.000 komisi 30%",
    ],
    links: ["https://t.me/tugasharian_resmi"],
    attachments: [{ id: "a2", label: "Screenshot chat WhatsApp", variant: "chat" }],
    author: "Pencari Kerja #3d9",
    createdAt: "2026-10-18T19:02:00+07:00",
    analyzedAt: "2026-10-18T18:55:00+07:00",
    reactionCount: 57,
    matchCount: 88,
    spamReports: 0,
    asliResponses: { count: 0, reasons: [] },
    isSeed: true,
    comments: [
      {
        id: "c5",
        author: "Pencari Kerja #b72",
        isNewAccount: false,
        body: "Awalnya dibayar beneran 45 ribu, terus diminta deposit 100 ribu, lalu 500 ribu dengan alasan salah input. Uangnya tidak bisa ditarik.",
        createdAt: "2026-10-19T07:44:00+07:00",
      },
      {
        id: "c6",
        author: "Pencari Kerja #0f4",
        isNewAccount: false,
        body: "Nomor yang menghubungi saya beda, tapi link grup Telegram-nya sama.",
        createdAt: "2026-10-20T13:10:00+07:00",
      },
    ],
  },
  {
    id: 119,
    title: "Operator Komputer · Bangkok, Thailand · berangkat Nov 2026",
    riskLevel: "tinggi",
    claim:
      "Tingkat Risiko Awal: Tinggi. Tawaran kerja ke luar negeri dengan visa kunjungan dan semua dokumen diurus sponsor, tanpa P3MI resmi. Pola ini sesuai dengan kasus TPPO online scam di Asia Tenggara.",
    modus: "tppo",
    position: "Operator Komputer",
    location: "Bangkok, Thailand",
    salary: "Rp9–12 juta per bulan",
    openDate: "2026-09-20",
    closeDate: "2026-10-31",
    source: { platform: "Facebook", account: "Grup Loker Luar Negeri Jatim" },
    contacts: [{ kind: "phone", value: "0857-0000-3310" }],
    summary:
      "Dicari operator komputer untuk perusahaan di Bangkok, gaji Rp9–12 juta, tanpa pengalaman. Tiket, paspor, dan visa diurus sponsor; berangkat dengan visa kunjungan lalu 'diurus izin kerja di sana'.",
    evidence: [
      {
        type: "tppo",
        description: "Berangkat bekerja ke luar negeri memakai visa kunjungan, tanpa perusahaan penempatan resmi.",
        evidence: "berangkat pakai visa kunjungan dulu, izin kerja diurus di sana",
      },
      {
        type: "overclaim",
        description: "Gaji tinggi untuk posisi tanpa syarat pengalaman.",
        evidence: "gaji 9-12 juta tanpa pengalaman",
      },
    ],
    materialLines: [
      "DIBUTUHKAN OPERATOR KOMPUTER DI BANGKOK",
      "Gaji 9-12 juta tanpa pengalaman, bisa bahasa Inggris dasar",
      "Tiket, paspor, visa semua diurus sponsor",
      "Berangkat pakai visa kunjungan dulu, izin kerja diurus di sana",
      "Minat hubungi 0857-0000-3310, kuota terbatas berangkat November",
    ],
    links: [],
    attachments: [{ id: "a3", label: "Poster lowongan", variant: "poster" }],
    author: "Pencari Kerja #c11",
    createdAt: "2026-10-02T15:40:00+07:00",
    analyzedAt: "2026-10-02T15:31:00+07:00",
    reactionCount: 12,
    matchCount: 19,
    spamReports: 0,
    asliResponses: { count: 0, reasons: [] },
    isSeed: true,
    comments: [
      {
        id: "c7",
        author: "Pencari Kerja #91e",
        isNewAccount: false,
        body: "Tetangga saya berangkat lewat tawaran yang mirip, ternyata dibawa ke Kamboja. Tolong jangan berangkat.",
        createdAt: "2026-10-04T21:18:00+07:00",
      },
    ],
  },
  {
    id: 133,
    title: "Lowongan Kasir Minimarket · Surabaya · 5–20 Okt 2026",
    riskLevel: "sedang",
    claim:
      "Tingkat Risiko Awal: Sedang. Formulir pendaftaran meminta foto KTP dan swafoto sambil memegang KTP sejak awal, sebelum ada wawancara. Identitas pemberi kerja juga belum bisa dipastikan.",
    modus: "data_sensitif",
    position: "Kasir",
    location: "Surabaya",
    openDate: "2026-10-05",
    closeDate: "2026-10-20",
    source: { platform: "TikTok", account: "@lokersurabaya.update" },
    contacts: [{ kind: "domain", value: "forms.gle/xxxxx (formulir Google)" }],
    summary:
      "Lowongan kasir minimarket di Surabaya. Pendaftaran lewat formulir Google yang meminta foto KTP, swafoto memegang KTP, dan nomor ibu kandung.",
    evidence: [
      {
        type: "sensitive_data",
        description: "Meminta foto KTP, swafoto dengan KTP, dan nama ibu kandung di tahap pendaftaran awal.",
        evidence: "upload foto KTP + selfie pegang KTP + nama ibu kandung",
      },
      {
        type: "missing_context",
        description: "Nama minimarket dan alamat kantor tidak disebutkan.",
      },
    ],
    materialLines: [
      "LOKER KASIR MINIMARKET SURABAYA",
      "Lulusan SMA/SMK, usia 18-25 tahun",
      "Daftar lewat formulir: upload foto KTP + selfie pegang KTP + nama ibu kandung",
      "Pendaftaran dibuka 5–20 Oktober 2026",
    ],
    links: ["https://forms.gle/xxxxx"],
    attachments: [],
    author: "Pencari Kerja #44c",
    createdAt: "2026-10-15T10:05:00+07:00",
    analyzedAt: "2026-10-15T10:01:00+07:00",
    reactionCount: 4,
    matchCount: 6,
    spamReports: 0,
    asliResponses: { count: 0, reasons: [] },
    isSeed: true,
    comments: [],
  },
  {
    id: 126,
    title: "Lowongan PT Mitra Digital Sejahtera · Customer Service · Bandung · Okt 2026",
    riskLevel: "sedang",
    claim:
      "Tingkat Risiko Awal: Sedang. Kontak rekrutmen hanya lewat Gmail dan WhatsApp pribadi, dan link pendaftarannya memakai shortlink. Tidak ada permintaan biaya, tetapi identitas perusahaan perlu diverifikasi.",
    modus: "lainnya",
    company: "PT Mitra Digital Sejahtera",
    position: "Customer Service",
    location: "Bandung",
    salary: "UMK Bandung + insentif",
    openDate: "2026-10-01",
    source: { platform: "Instagram", account: "@mitradigital.karier" },
    contacts: [
      { kind: "email", value: "hrd.mitradigital@gmail.com" },
      { kind: "phone", value: "0813-0000-2045" },
      { kind: "domain", value: "bit.ly/daftar-mds" },
    ],
    summary:
      "Lowongan customer service di Bandung dengan gaji UMK + insentif. Lamaran dikirim lewat shortlink dan konfirmasi lewat Gmail atau WhatsApp HRD.",
    evidence: [
      {
        type: "suspicious_contact",
        description: "Kanal rekrutmen memakai email gratis dan shortlink, sehingga identitas perusahaan sulit dipastikan.",
        evidence: "kirim CV ke hrd.mitradigital@gmail.com atau bit.ly/daftar-mds",
      },
    ],
    materialLines: [
      "PT Mitra Digital Sejahtera membuka lowongan Customer Service",
      "Penempatan Bandung, gaji UMK + insentif",
      "Kirim CV ke hrd.mitradigital@gmail.com atau bit.ly/daftar-mds",
      "Info: WA HRD 0813-0000-2045",
    ],
    links: ["https://bit.ly/daftar-mds"],
    attachments: [{ id: "a5", label: "Poster lowongan", variant: "poster" }],
    author: "Pencari Kerja #2be",
    createdAt: "2026-10-09T13:22:00+07:00",
    analyzedAt: "2026-10-09T13:15:00+07:00",
    reactionCount: 3,
    matchCount: 9,
    spamReports: 0,
    asliResponses: {
      count: 3,
      reasons: [
        "Saya bekerja di sini sejak 2025. HRD memang memakai Gmail karena kantornya masih kecil.",
        "Saya sudah interview langsung di kantornya di Jl. Contoh No. 10, tidak ada biaya apa pun.",
      ],
    },
    isSeed: true,
    comments: [
      {
        id: "c8",
        author: "Pencari Kerja #77d",
        isNewAccount: false,
        body: "Saya ikut interview minggu lalu, prosesnya normal. Tapi memang sebaiknya cek alamat kantornya dulu.",
        createdAt: "2026-10-11T09:02:00+07:00",
      },
    ],
  },
  {
    id: 122,
    title: "Program Magang Nasional Batch 2 · Mencatut Kementerian · 2026",
    riskLevel: "tinggi",
    claim:
      "Tingkat Risiko Awal: Tinggi. Mengatasnamakan program magang pemerintah tetapi meminta biaya pendaftaran ke rekening pribadi, dan situs pendaftarannya tidak berdomain resmi pemerintah.",
    modus: "impersonasi",
    position: "Peserta Magang",
    location: "Seluruh Indonesia",
    openDate: "2026-09-25",
    closeDate: "2026-10-25",
    source: { platform: "Website", account: "pendaftaran-magangnasional.example" },
    contacts: [
      { kind: "domain", value: "pendaftaran-magangnasional.example" },
      { kind: "account", value: "BCA 0000-112-233 a.n. pribadi" },
    ],
    summary:
      "Pendaftaran program magang nasional batch 2 yang mengatasnamakan kementerian. Peserta diminta membayar biaya administrasi Rp250.000 ke rekening pribadi.",
    evidence: [
      {
        type: "payment_request",
        description: "Biaya administrasi pendaftaran ditransfer ke rekening pribadi.",
        evidence: "biaya administrasi Rp250.000 ke BCA 0000-112-233",
      },
      {
        type: "suspicious_contact",
        description: "Situs pendaftaran tidak memakai domain resmi pemerintah (go.id).",
        evidence: "daftar di pendaftaran-magangnasional.example",
      },
    ],
    materialLines: [
      "PROGRAM MAGANG NASIONAL BATCH 2 TAHUN 2026",
      "Daftar di pendaftaran-magangnasional.example",
      "Biaya administrasi Rp250.000 ke BCA 0000-112-233",
      "Pendaftaran 25 September – 25 Oktober 2026",
    ],
    links: ["https://pendaftaran-magangnasional.example"],
    attachments: [{ id: "a6", label: "Poster program magang", variant: "poster" }],
    author: "Pencari Kerja #8f0",
    createdAt: "2026-09-28T08:15:00+07:00",
    analyzedAt: "2026-09-28T08:09:00+07:00",
    reactionCount: 31,
    matchCount: 52,
    spamReports: 1,
    asliResponses: { count: 0, reasons: [] },
    isSeed: true,
    comments: [],
  },
];

/** The draft a user would get from a "Tinggi" telaah in the chat prototype (scenario 1). */
export const DRAFT_FROM_CHAT = {
  titleSuggestions: [
    "Lowongan PT Listrik Nusantara (Persero) · Staff Admin · Jakarta · 1–30 Okt 2026",
    "Surat Panggilan Tes PT Listrik Nusantara (Persero) · Staff Admin · Okt 2026",
  ],
  riskLevel: "tinggi" as TelaahRiskLevel,
  claim: posts[0].claim,
  modus: "biaya" as TelaahModus,
  company: posts[0].company,
  position: posts[0].position,
  location: posts[0].location,
  openDate: posts[0].openDate,
  closeDate: posts[0].closeDate,
  source: { platform: "Instagram", account: "@rekrutmen.bumn.terbaru" },
  contacts: posts[0].contacts,
  summary: posts[0].summary,
  evidence: posts[0].evidence,
  materialLines: [
    "Kepada Yth. Rina Anggraini",
    "NIK [NIK disensor]",
    ...posts[0].materialLines,
  ],
  links: posts[0].links,
  attachments: [
    { id: "d1", label: "Surat panggilan tes", variant: "poster" as const },
    {
      id: "d2",
      label: "Screenshot email undangan",
      variant: "chat" as const,
      sensitiveWarning: "Gambar ini tampaknya memuat nama dan alamat email kamu. Hapus jika tidak ingin dibagikan.",
    },
  ],
};

const ACCUSATORY_WORDS = /\b(penipu|penipuan|scam|palsu|bodong|abal-abal|hoaks|hoax)\b/i;

export function hasAccusatoryWord(text: string): boolean {
  return ACCUSATORY_WORDS.test(text);
}

// shortcut: 16 digits with optional spaces stands in for redaction.ts (design doc 6.3), which also checks the province code.
const NIK_LIKE = /\b\d(?:\s?\d){15}\b/g;

export function hasNikLikeNumber(text: string): boolean {
  return text.search(NIK_LIKE) >= 0;
}

export function maskNik(text: string): string {
  return text.replace(NIK_LIKE, "[NIK disensor]");
}

const STEERING_COMMENT = /\b(aman( kok)?|bukan penipuan|terpercaya|sudah digaji|asli kok|transfer saja)\b/i;

/** Stand-in for the real "klaim tanpa bukti" detector (signals.ts manipulation logic). */
export function looksLikeUnbackedClaim(text: string): boolean {
  return STEERING_COMMENT.test(text);
}

/** hot_score from the design doc: (2·reactions + comments + matches) / (hours + 2)^1.5 */
export function hotScore(post: TelaahPost, now = Date.now()): number {
  const hours = Math.max(0, (now - new Date(post.createdAt).getTime()) / 3_600_000);
  return (2 * post.reactionCount + post.comments.length + post.matchCount) / Math.pow(hours + 2, 1.5);
}

export { formatRelativeTime as formatRelative } from "@/utils/formatters";

const DATE = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatPeriod(openDate?: string, closeDate?: string): string | null {
  if (openDate && closeDate) return `${formatDate(openDate)} – ${formatDate(closeDate)}`;
  if (openDate) return `dibuka ${formatDate(openDate)}`;
  if (closeDate) return `ditutup ${formatDate(closeDate)}`;
  return null;
}
