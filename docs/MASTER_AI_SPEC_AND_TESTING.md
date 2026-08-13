# DOKUMEN SPESIFIKASI DAN SKENARIO PENGUJIAN AI ENGINE
## TelaahKarier — Master Blueprint & Testing Suite

| Atribut Dokumen | Detail |
|---|---|
| **Nama Proyek** | TelaahKarier (Platform AI Interaktif Analisis Risiko Lowongan Kerja) |
| **Versi Dokumen** | 2.1.0 (Live Execution & Fully Verified Edition) |
| **Target Event** | GEMASTIK — Pengembangan Perangkat Lunak |
| **Scope Dokumen** | PRD Lengkap, Arsitektur AI, Cetak Biru Komponen, & Skenario Pengujian Per Perubahan |
| **Penyusun** | Tim Kelaz king (Universitas Brawijaya) |
| **Status** | **PASSED & FULLY VERIFIED (100% Green)** |

---

# BAB 1: PRODUCT REQUIREMENT DOCUMENT (PRD) LENGKAP

## 1.1 Visi Produk & Latar Belakang
Penipuan lowongan kerja digital di Indonesia mengalami peningkatan pesat dengan kerugian mencapai triliunan rupiah (IASC 2026). Kelompok yang paling rentan adalah mahasiswa tingkat akhir, *fresh graduate*, dan lulusan SMK.

**TelaahKarier** hadir bukan sekadar sebagai chatbot linier biasa, melainkan sebagai **Workspace Investigasi Interaktif berbasis AI** yang membedah informasi lowongan kerja berformat multimodal (teks, link, poster/gambar) menjadi komponen visual yang mudah dipahami (*Generative UI Cards*) serta memandu langkah pencegahan melalui tombol aksi interaktif (*Structured UI Actions*).

## 1.2 Tujuan Utama (Goals)
1. **Mengganti 100% Mock Analyzer**: [SELESAI ✅] Seluruh skenario di `analyze.ts` telah digantikan oleh agen AI nyata menggunakan Google Gemini 2.5 Flash (`@langchain/google-genai`).
2. **Kepatuhan Data Contract 100%**: [SELESAI ✅] Seluruh output LLM mematuhi Zod Schema ter-inlined (`schema.ts`) tanpa `$ref` untuk kompatibilitas penuh Gemini API.
3. **Pengalaman Respons Berkelanjutan (Streaming UI)**: [SELESAI ✅] Urutan data terstruktur disalurkan secara progresif (*data-reasoning*, *data-summary*, *data-claims*, *data-risks*, dll) menggunakan Vercel AI SDK *Data Stream Protocol*.
4. **Explainable & Safe AI**: [SELESAI ✅] Sistem menolak memberikan vonis mutlak (100% asli/palsu), selalu memberikan asesmen kehati-hatian (*risk triage*) disertai sitasi dari Tavily Search API.

## 1.3 Target Pengguna & Persona
* **Primary Persona**: Andik (21 tahun, Fresh Graduate SMK/S1), sering menerima broadcast lowongan kerja paruh waktu/magang di Telegram/WhatsApp/Instagram. Belum berpengalaman membedakan kontak rekrutmen resmi dan penipu.
* **Secondary Persona**: Konselor Karir Kampus / Pengelola BKK SMK yang membutuhkan alat bantu skrining awal bagi mahasiswa/alumni.

## 1.4 Spesifikasi Kebutuhan Fungsional (Functional Requirements)

| Kode FR | Nama Fitur | Deskripsi Kebutuhan | Status |
|---|---|---|---|
| **FR-01** | *Multimodal Input Preprocessing* | Memproses teks deskripsi, mengekstrak URL dari link pendaftaran, mendeteksi shortlink & domain email non-korporat. | **VERIFIED ✅** |
| **FR-02** | *Reasoning Process Generation* | Menghasilkan 3–5 tahapan logika investigasi AI secara progresif sebelum menampilkan kesimpulan (*thinking step*). | **VERIFIED ✅** |
| **FR-03** | *Structured Risk Assessment* | Menghasilkan 1 skor keyakinan & ringkasan tingkat risiko awal (`Tinggi`/`Sedang`/`Rendah`), serta daftar *red flags* (`bias`, `overclaim`, `missing_context`). | **VERIFIED ✅** |
| **FR-04** | *Context-Aware Action Handlers* | Memproses 5 tombol aksi investigasi (`validate_company`, `check_red_flags`, `check_link_contact`, `check_salary_benefit_reasonableness`, `safe_next_steps`) berbasis konteks. | **VERIFIED ✅** |
| **FR-05** | *Web Search & Citation Retrieval* | Memanfaatkan Tavily Search API untuk memvalidasi keberadaan perusahaan resmi dan menyajikannya sebagai kartu rujukan. | **VERIFIED ✅** |
| **FR-06** | *Generative UI Stream Dispatcher* | Menyalurkan event stream dalam urutan yang tepat sesuai kontrak `AssistantMessage.tsx`. | **VERIFIED ✅** |

## 1.5 Spesifikasi Kebutuhan Non-Fungsional (Non-Functional Requirements)

| Kode NFR | Parameter | Target Metrik & Batasan | Status |
|---|---|---|---|
| **NFR-01** | *Response Latency* | First-token stream < 1.5 detik; Total inferensi analisis awal < 8 detik. | **VERIFIED ✅** |
| **NFR-02** | *Safety Guardrails* | Dilarang keras menggunakan kata "pasti penipuan 100%" atau "100% aman". Menggunakan kalimat "terindikasi berisiko" atau "perlu verifikasi". | **VERIFIED ✅** |
| **NFR-03** | *Reliability & Resilience* | Jika API LLM/Web Search error/timeout, sistem membalas dengan *graceful fallback card* tanpa membuat UI *crash*. | **VERIFIED ✅** |
| **NFR-04** | *Scalability & Statelessness* | Kode AI Engine bersifat *pure function/stateless*, siap dijalankan di Serverless / Container dan mendukung penambahan *Semantic Caching* (Redis). | **VERIFIED ✅** |

---

# BAB 2: ARSITEKTUR DAN CETAK BIRU KOMPONEN AI

## 2.1 Peta Komponen AI Engine (`web/langchain/agents/analyzer/`)

```text
web/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts                  <-- [STREAM ORCHESTRATOR] Mengatur urutan stream ke Vercel AI SDK
└── langchain/
    └── agents/
        └── analyzer/
            ├── schema.ts                 <-- [DATA CONTRACT] Inlined Zod Schemas (Gemini Compatible)
            ├── prompts.ts                <-- [PROMPT SYSTEM] System prompt, Guardrails & Fair Evaluation
            ├── llm.ts                    <-- [LLM CLIENT] Singleton Gemini 2.5 Flash (maxTokens: 8192)
            ├── preprocessor.ts            <-- [PREPROCESSOR] Text sanitizer, URL parser, shortlink detector
            ├── action-handler.ts          <-- [ACTION AGENT] Handler 5 UI Action Chips
            ├── analyze.ts                <-- [CORE AGENT] Main Orchestrator (Structured Output & Fallback)
            └── tools/
                └── tavily-search.ts      <-- [TOOL] Web search validasi perusahaan
```

---

# BAB 3: SKENARIO PENGUJIAN LENGKAP DAN HASIL VERIFIKASI (TEST SUITE)

Di bawah ini adalah spesifikasi skenario pengujian komprehensif, mencakup **Input Teks**, **Ekspektasi Output AI**, **Kriteria Kelulusan**, serta **Hasil Verifikasi Aktual** per milestone:

---

## 🧪 MILESTONE 1: Testing Client LLM & Core Risk Analyzer (`analyze.ts`)

### Skenario 1.1: Input Lowongan Sangat Mencurigakan (High Risk - Modus Deposit Biaya)
- **Input**: `"Lowongan kerja Admin Data Entry Remote. Gaji 7-9 juta/bulan. Tanpa ijazah. Pendaftaran cepat via WA 08123456789. Wajib bayar biaya modul onboarding Rp 150.000."`
- **Ekspektasi Output AI**:
  - `claims[0].text`: Terindikasi Risiko Tinggi.
  - `claims[0].confidence`: > 0.80.
  - `risks`: Memuat tipe `overclaim` dan `bias` (permintaan bayar di muka & WhatsApp personal).
  - `salaryBenefit.status`: "Perlu Diverifikasi" / "Tidak Wajar untuk Entry Level".
- **Kriteria Kelulusan**: UI menampilkan kartu warna merah/kuning (*High Risk*), pesan streaming lancar tanpa crash.
- **Hasil Verifikasi Aktual**:
  - `claims[0].text`: `"Tingkat Risiko Awal: Tinggi. Ditemukan indikator mencurigakan..."`
  - `claims[0].confidence`: `0.90` (90%)
  - `risks`: Memuat `overclaim` (gaji tak wajar) & `bias` (biaya modul Rp 150.000 di muka via WA).
- **Status**: **PASSED ✅**

### Skenario 1.2: Input Lowongan Perusahaan Resmi (Kasus Flip / BCA - Low Risk)
- **Input**: `"Flip started as a project in 2015 to transfer payments to each other at a fraction of what banks would charge them. Flip has helped millions of Indonesians... Flip has received double-digit funding from Sequoia India..."`
- **Ekspektasi Output AI**:
  - `claims[0].text`: Terindikasi Risiko Rendah / Perusahaan Terverifikasi Resmi.
  - `claims[0].confidence`: > 0.85.
  - `risks`: Kosong atau hanya pengingat edukasi umum.
  - `explanations`: Menjelaskan entitas Flip (PT Fliptech) adalah perusahaan resmi yang valid.
- **Kriteria Kelulusan**: UI menampilkan indikator hijau (*Low Risk*), frasa tetap menggunakan kehati-hatian.
- **Hasil Verifikasi Aktual**:
  - `claims[0].text`: `"Tingkat Risiko Awal: Rendah. Lowongan berasal dari entitas perusahaan resmi (Flip / PT Fliptech)..."`
  - `claims[0].confidence`: `0.90` (90%)
  - Evaluasi adil berjalan tanpa menandai sejarah startup/pendanaan investor sebagai red flag.
- **Status**: **PASSED ✅**

### Skenario 1.3: Input Vague / Minim Informasi
- **Input**: `"Ada yang tahu loker ini aman gak?"`
- **Ekspektasi Output AI**:
  - `claims[0].text`: Informasi belum cukup untuk analisis.
  - `suggestedQuestions`: Menampilkan saran pertanyaan untuk meminta materi lowongan.
- **Kriteria Kelulusan**: AI tidak memaksakan vonis dan meminta informasi tambahan secara sopan.
- **Hasil Verifikasi Aktual**:
  - AI meminta detail teks lowongan/link dan menampilkan saran pertanyaan interaktif.
- **Status**: **PASSED ✅**

### Skenario 1.4: Validation & Fallback Test (LLM Malformed Output / Token Cutoff)
- **Metode**: Mengkondisikan error API limit / token truncation (`maxOutputTokens: 8192`).
- **Ekspektasi Output AI**: Catch error menangkap *exception* dan mengembalikan *fallback AnalysisResult* standar.
- **Kriteria Kelulusan**: Aplikasi tidak mengalami *White Screen of Death (WSOD)* atau error 500 unhandled.
- **Hasil Verifikasi Aktual**:
  - `try-catch` menangkap error dan mengalihkan ke `buildSmartAnalysisFallback()` tanpa merusak UI.
- **Status**: **PASSED ✅**

---

## 🧪 MILESTONE 2: Testing 5 UI Action Chips (`action-handler.ts`)

### Skenario 2.1: Klik Aksi `validate_company`
- **Input Action**: `{ type: "UI_ACTION", actionId: "validate_company", context: "PT Maju Sejahtera..." }`
- **Ekspektasi Output AI**: Event Stream memancarkan `data-action-insight` dengan `title: "Checklist Validasi Perusahaan"` & 4 poin verifikasi.
- **Kriteria Kelulusan**: `ActionInsightCard` muncul di timeline percakapan dengan animasi mulus.
- **Hasil Verifikasi Aktual**: Kartu *Checklist Validasi Perusahaan* dirender secara tepat.
- **Status**: **PASSED ✅**

### Skenario 2.2: Klik Aksi `check_red_flags`
- **Input Action**: `{ type: "UI_ACTION", actionId: "check_red_flags" }`
- **Ekspektasi Output AI**: Event Stream memancarkan `data-action-insight` membedah minimal 4 indikator red flags.
- **Kriteria Kelulusan**: Poin red flags terbaca dengan jelas di UI.
- **Hasil Verifikasi Aktual**: Kartu *Indikator Mencurigakan yang Perlu Diwaspadai* dirender dengan 4 poin red flags.
- **Status**: **PASSED ✅**

### Skenario 2.3: Klik Aksi `check_link_contact`
- **Input Action**: `{ type: "UI_ACTION", actionId: "check_link_contact" }`
- **Ekspektasi Output AI**: Poin analisis difokuskan pada analisis domain, nomor WhatsApp personal, dan shortlink.
- **Kriteria Kelulusan**: Insight kartu link & kontak dirender sesuai tipe event.
- **Hasil Verifikasi Aktual**: Kartu *Analisis Risiko Link & Kontak* dirender sesuai konteks.
- **Status**: **PASSED ✅**

### Skenario 2.4: Klik Aksi `check_salary_benefit_reasonableness`
- **Input Action**: `{ type: "UI_ACTION", actionId: "check_salary_benefit_reasonableness" }`
- **Ekspektasi Output AI**: Memancarkan event `data-salary-benefit` berisi `SalaryBenefitAssessment`.
- **Kriteria Kelulusan**: `SalaryBenefitCard` dirender dengan badge status dan highlight poin.
- **Hasil Verifikasi Aktual**: Kartu *Kewajaran Gaji & Benefit* dirender di UI.
- **Status**: **PASSED ✅**

### Skenario 2.5: Klik Aksi `safe_next_steps`
- **Input Action**: `{ type: "UI_ACTION", actionId: "safe_next_steps" }`
- **Ekspektasi Output AI**: Memancarkan `data-action-insight` berisi 4-5 panduan langkah pencegahan.
- **Kriteria Kelulusan**: Langkah aman dirender di bagian akhir investigasi.
- **Hasil Verifikasi Aktual**: Kartu *Langkah Aman Sebelum Bertindak* dirender dengan 5 poin rekomendasi.
- **Status**: **PASSED ✅**

---

## 🧪 MILESTONE 3: Testing Web Search Tool (`tavily-search.ts`)

### Skenario 3.1: Validasi Perusahaan Nyata via Web Search
- **Input**: `"Loker Digital Marketer PT Paragon Technology and Innovation"`
- **Proses AI**: Agent memanggil `tavily-search.ts` dengan query `"PT Paragon Technology and Innovation career official site"`.
- **Ekspektasi Output**: Memancarkan `data-references` berisi link resmi (`paragon-id.com` atau LinkedIn resmi).
- **Kriteria Kelulusan**: Sumber pencarian muncul dan link dapat diklik oleh pengguna.
- **Hasil Verifikasi Aktual**: Referensi web resmi berhasil ditarik dan ditampilkan di sidebar context panel.
- **Status**: **PASSED ✅**

### Skenario 3.2: Perusahaan Fiktif / Tidak Ditemukan
- **Input**: `"Loker Admin PT Makmur Jaya Penipuan Abadi 123"`
- **Proses AI**: Web search tidak menemukan hasil yang cocok.
- **Ekspektasi Output**: AI memberikan catatan bahwa identitas perusahaan tidak ditemukan di indeks web publik.
- **Kriteria Kelulusan**: AI menjelaskan ketiadaan jejak digital sebagai salah satu indikator risiko.
- **Hasil Verifikasi Aktual**: AI menyimpulkan entitas tidak terdaftar di indeks web publik dan menaikkan indikator kehati-hatian.
- **Status**: **PASSED ✅**

---

## 🧪 MILESTONE 4: Testing Streaming & End-to-End UI Integration

### Skenario 4.1: Streaming Event Sequence Test
- **Metode**: Inspect SSE Response Network Stream di Browser DevTools.
- **Ekspektasi Urutan Chunk**: `data-reasoning` -> `text-start/delta/end` -> `data-summary` -> `data-claims` -> `data-salary-benefit` -> `data-risks` -> `data-explanation` -> `data-references` -> `data-actions` -> `data-suggested-questions`.
- **Kriteria Kelulusan**: Tidak ada event yang terlewat atau keluar dari urutan yang membuat UI rendering error.
- **Hasil Verifikasi Aktual**: Seluruh 10 event chunk terpancar dengan urutan 100% presisi.
- **Status**: **PASSED ✅**

---

# BAB 4: CEKLIS KELAYAKAN DEMO & EVENT GEMASTIK

Seluruh poin ceklis kelayakan telah **100% Terverifikasi Hijau**:

- [x] **Tidak ada Mock Data lagi di `analyze.ts`**.
- [x] **Seluruh 5 UI Action Chips merespons secara dinamis sesuai konteks**.
- [x] **Streaming Reasoning Process (Thinking step) berjalan lancar saat AI berpikir**.
- [x] **Tampilan Generative UI Cards di desktop dan mobile tetap responsif dan rapi**.
- [x] **API Keys terisolasi dengan aman di `web/.env.local`**.
- [x] **Skema Zod ter-inlined tanpa error Gemini API `$ref`**.
- [x] **Dokumentasi Wiki terstruktur rapi di `docs/wiki/ai/` dengan penomoran standar**.
