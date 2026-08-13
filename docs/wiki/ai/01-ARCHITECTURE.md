# 🏗️ 01. AI Engine Architecture

Dokumen ini menjelaskan arsitektur teknis modul **AI Engine** di TelaahKarier.

---

## 📐 1. Komponen Utama Arsitektur

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend (/chat)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP POST /api/chat
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         API Route Handler                              │
│                      (web/app/api/chat/route.ts)                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       AI Analyzer Core Engine                          │
│                (web/langchain/agents/analyzer/analyze.ts)              │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. Preprocessor                   │ 2. Web Verification Tool           │
│    - Input text Sanitizer         │    - Tavily Search API             │
│    - Shortlink & Free Email Check │    - Official Domain Fetcher       │
└───────────────────────────────────┴────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        LangChain LLM Engine                            │
│ ┌──────────────────────────────┐    ┌────────────────────────────────┐ │
│ │ Model Factory (llm.ts)       │    │ System Prompts (prompts.ts)    │ │
│ │ - ChatGoogleGenerativeAI     │    │ - Explainable AI Guardrails    │ │
│ │ - Gemini 2.5 Flash / Lite    │    │ - Fair Evaluation Rules        │ │
│ └──────────────┬───────────────┘    └────────────────┬───────────────┘ │
│                │                                     │                 │
│                └──────────────────┬──────────────────┘                 │
│                                   ▼                                    │
│                     Structured Output Generator                        │
│                       withStructuredOutput()                           │
│                                   │                                    │
│                                   ▼                                    │
│                     Zod Schema (schema.ts)                             │
│                     - Inlined AnalysisSchema                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Fallback Engine                                │
│             (Rule-Augmented Deterministic Risk Generator)               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 2. Struktur Modul & Fungsi

| File | Fungsi & Tanggung Jawab |
|---|---|
| `web/langchain/agents/analyzer/llm.ts` | Factory singleton untuk menginisialisasi instance model AI. Mendukung `gemini-2.5-flash` dengan konfigurasi `maxOutputTokens: 8192`. |
| `web/langchain/agents/analyzer/schema.ts` | Definisi Zod schema ter-inlined (tanpa `$ref`) untuk menghasilkan *structured JSON output* tingkat risiko, klaim, risikotype, penjelasan, dan *suggested questions*. |
| `web/langchain/agents/analyzer/prompts.ts` | *System Prompt* utama dan template *UI Action*. Mengandung aturan Explainable AI, larangan vonis mutlak 100%, dan panduan evaluasi adil untuk perusahaan resmi. |
| `web/langchain/agents/analyzer/preprocessor.ts` | Sanitasi input teks, pemindaian domain email non-korporat (`@gmail`, `@yahoo`), dan pendeteksian shortlink (`bit.ly`, `wa.me`). |
| `web/langchain/agents/analyzer/tools/tavily-search.ts` | Tool pencarian web pihak ketiga untuk verifikasi keberadaan legalitas/halaman karir perusahaan secara real-time. |
| `web/langchain/agents/analyzer/action-handler.ts` | Handler khusus untuk merespons chip tindakan cepat UI (seperti *"Validasi Perusahaan"*, *"Cek Red Flag"*, *"Beri Langkah Aman"*). |

---

## 🛡️ 3. Prinsip Guardrails & Explainable AI
1. **Tidak Ada Vonis Mutlak 100%**: AI dilarang keras menyatakan "100% Penipuan" atau "100% Aman". Diksi yang digunakan adalah *"Terindikasi risiko awal tinggi/sedang/rendah"* dan *"Perlu verifikasi lanjutan"*.
2. **Reasoning Steps (Transparansi Tahapan)**: Setiap respons JSON menghasilkan array `reasoning` yang memaparkan langkah-langkah logika pemikiran AI secara terbuka kepada pengguna.
3. **Single Risk Verdict Card**: Field `claims` hanya berisi 1 item utama yang merangkum keseluruhan asesmen risiko agar tampilan UI konsisten dan tidak membingungkan pengguna.
