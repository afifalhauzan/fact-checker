# 🔍 04. AI Integration Findings & Lessons Learned

Dokumen ini mendokumentasikan secara rinci penemuan teknis (findings), batasan API, bug penting yang berhasil dipecahkan, dan pelajaran berharga (*lessons learned*) selama pengembangan AI Engine TelaahKarier.

---

## 🛠️ 1. Findings & Penyelesaian Bug Kritis

### A. Finding 1: Gemini API Unsupported `$ref` Schema Error (400 Bad Request)
- **Problem**: Saat memanggil `llm.withStructuredOutput(AnalysisSchema)` menggunakan `@langchain/google-genai`, server Gemini mengembalikan error:
  `[400 Bad Request] Invalid JSON payload received. Unknown name "$ref" at 'generation_config.response_schema...'`
- **Root Cause**: Generator JSON Schema bawaan Zod (`zod-to-json-schema`) yang digunakan LangChain otomatis membuat referensi `$ref` (seperti `"$ref": "#/definitions/CitationSchema"`) ketika suatu sub-schema didefinisikan sebagai konstanta terpisah. Server Google Gemini API belum mendukung penanganan `$ref` pada `response_schema`.
- **Solution & Fix**: Seluruh skema di `schema.ts` diubah menjadi **inlined schema** total. Semua definisi objek sub-item ditulis secara eksplisit di dalam `z.object()` tanpa mereferensikan variabel Zod lain.

### B. Finding 2: JSON Output Truncation (`OUTPUT_PARSING_FAILURE`)
- **Problem**: Sistem sering mengembalikan respons dari *smart fallback* daripada respons LLM asli karena error `OUTPUT_PARSING_FAILURE` di mana string JSON terpotong di tengah jalan (misal: `' "Apakah ada kontrak'`).
- **Root Cause**: Pengaturan awal `maxOutputTokens: 2048` pada `llm.ts` terlalu sempit untuk menampung respons JSON yang kaya (mengandung *claims*, *salaryBenefit*, *risks*, *explanations*, *reasoning*, dan *suggestedQuestions*).
- **Solution & Fix**: 
  1. Batas `maxOutputTokens` ditingkatkan menjadi **`8192`**.
  2. Prompt guardrail diperbarui agar penjelasan tetap padat (maksimal 2-3 kalimat per item).

### C. Finding 3: AI Over-sensitivity & Bias pada Perusahaan Resmi (Kasus Flip)
- **Problem**: Saat memasukkan deskripsi lowongan resmi dari perusahaan ternama (seperti PT Fliptech / Flip), AI mengekstrak 3 kalimat latar belakang perusahaan sebagai 3 "Kartu Risiko" dan secara salah menandai pendanaan investor resmi (Sequoia, Insight Partners) sebagai hal yang mencurigakan.
- **Root Cause**: Prompt awal tidak mendefinisikan secara spesifik fungsi field `claims` dan belum menyertakan instruksi *Fair Evaluation* untuk perusahaan yang sah.
- **Solution & Fix**:
  1. Prompt diperbarui agar `claims` HANYA berisi 1 item ringkasan "Tingkat Risiko Awal" secara utuh.
  2. Ditambahkan aturan eksplisit: Latar belakang startup resmi, pendanaan investor ternama, dan benefit kerja remote resmi WAJIB dinilai sebagai **"Tingkat Risiko Awal: Rendah"** selama tidak ada indikator bahaya (seperti permintaan biaya atau kontak personal non-resmi).

### D. Finding 4: AI Mengulang Teks Input Pengguna di `conversationText`
- **Problem**: Karakter sapaan pembuka AI di UI (*field* `conversationText`) berisi salinan ulang (*echo*) dari seluruh teks lowongan yang diinput pengguna.
- **Root Cause**: Kurangnya konteks definisi fungsi field `conversationText` di schema dan prompt.
- **Solution & Fix**:
  1. Ditambahkan Zod `.describe("MUST ONLY contain AI opening greeting. NEVER copy the user's input text here.")` langsung pada `schema.ts`.
  2. Ditambahkan guardrail eksplisit di `prompts.ts` yang melarang keras mengulang teks input pengguna.

---

## 💡 2. Lessons Learned (Pelajaran Penting)

1. **Structured Output Tidak Selalu Sama Antar Provider LLM**:
   Meskipun LangChain menyediakan abstraksi `.withStructuredOutput()`, tiap provider (Google Gemini, OpenAI, Anthropic) memiliki perilaku berbeda terhadap JSON Schema. Gemini sangat sensitif terhadap `$ref` dan `$defs`.
2. **Schema Description Memiliki Bobot Prompt yang Tinggi**:
   Menambahkan `.describe()` pada field Zod Schema ternyata sangat efektif mengarahkan perilaku LLM secara langsung saat generasi JSON, seringkali lebih efektif daripada menyematkannya di *System Prompt* utama.
3. **Pentingnya Deterministic Fallback Engine**:
   Memiliki `buildSmartAnalysisFallback()` berbasis aturan regex/preprocessor memastikan bahwa aplikasi pengguna **tidak pernah mengalami error kosong (blank screen)** saat API mengalami kehabisan kuota, rate limit (429), atau gangguan jaringan.
