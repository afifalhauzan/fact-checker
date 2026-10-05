# 📡 03. AI API Documentation

Dokumen ini merinci endpoint API dan kontrak data JSON untuk integrasi antara Frontend dan AI Engine.

---

## 🟢 1. Endpoint Utama: Analisis Lowongan & Chat

- **URL**: `/api/chat`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Response**: Vercel AI SDK UI Message Stream (SSE)

### A. Request Payload

Format mengikuti `DefaultChatTransport` dari AI SDK: seluruh riwayat `messages` dikirim setiap request.

#### Mode 1: Analisis Lowongan Baru
```json
{
  "id": "<conversation-id>",
  "trigger": "submit-message",
  "messages": [
    {
      "id": "u1",
      "role": "user",
      "parts": [
        { "type": "text", "text": "Lowongan kerja Admin Data Entry Remote. Gaji 7-9 juta/bulan. Pendaftaran via WA 08123456789. Wajib bayar biaya modul Rp 150.000." },
        { "type": "file", "mediaType": "image/png", "url": "data:image/png;base64,..." },
        { "type": "file", "mediaType": "application/pdf", "url": "data:application/pdf;base64,..." }
      ]
    }
  ]
}
```

#### Mode 2: Eksekusi UI Action Chip
```json
{
  "messages": ["...riwayat lengkap, termasuk pesan asisten yang berisi part data-analysis..."],
  "action_type": "UI_ACTION",
  "action_payload": {
    "type": "UI_ACTION",
    "actionId": "check_link_contact",
    "actionLabel": "Periksa Link & Kontak",
    "sourceMessageId": "<id pesan asisten tempat chip diklik>"
  }
}
```

Server mencari pesan asisten `sourceMessageId`, mengambil `data-analysis`-nya, lalu memakai **teks dan gambar lowongan asli** dari pesan user sebelumnya sebagai konteks aksi. Field `context`/`claim` di payload hanya dipakai jika riwayat tidak memuat analisis.

#### Routing: Analisis vs Tanya-Jawab (`turn-router.ts`)

Request tanpa `action_payload` dirutekan dulu:

| Kondisi pesan terbaru | Mode |
|---|---|
| Hanya berisi file berformat selain gambar/PDF | Dijawab "format belum didukung" tanpa analisis |
| Ada lampiran gambar/PDF, teks kosong, atau teks > 500 karakter | Analisis |
| Belum ada lowongan yang dibahas dan teks tidak substansial ("halo") | Analisis (balasan singkat tanpa model) |
| Selain itu | Klasifikasi model: `materi_lowongan` → Analisis, `pertanyaan` → Tanya-jawab. Jika klasifikasi gagal, kalimat berakhiran "?" dianggap pertanyaan. |

**Mode tanya-jawab** (`follow-up.ts`) menjawab dengan konteks lowongan terakhir yang punya verdict (teks, gambar, hasil analisis, sumber terverifikasi) dan maksimal 6 giliran percakapan terakhir. Jika belum ada lowongan, pertanyaan dijawab sebagai pertanyaan umum. Event stream-nya:
1. `text-*`: jawaban Markdown. Penanda sitasi `[S1]` diubah ke label `[1]` yang sama dengan di analisis; ID yang tidak ada dibuang.
2. `data-references`: hanya sumber yang dikutip (jika ada).
3. `data-suggested-questions`: 2–3 pertanyaan lanjutan.

Tidak ada `data-analysis` maupun action chip pada mode ini.

---

### B. Urutan Event Stream (Mode 1)

1. `data-reasoning` (id tetap, diperbarui berkali-kali): **progres nyata** tiap tahap pipeline, yaitu baca materi → deteksi pola berbasis aturan → pencarian web → model AI. Tidak ada jeda buatan.
2. `text-*`: sapaan pembuka.
3. `data-reasoning` final: tahap pipeline + langkah analisis model (+ catatan "Pengaman aturan" jika verdict dinaikkan).
4. `data-summary`, `data-claims` (atau teks follow-up jika tidak ada verdict), `data-salary-benefit`, `data-risks`, `data-explanation`, `data-references`.
5. `data-actions`: hanya dikirim jika ada verdict (`claims` tidak kosong).
6. `text-*` penutup, `data-suggested-questions`, `data-analysis` (objek lengkap).

### C. Objek `AnalysisResult` (`data-analysis`)

```json
{
  "conversationText": "Halo! Saya akan membantu menelaah lowongan kerja ini.",
  "claims": [
    {
      "riskLevel": "tinggi",
      "text": "Tingkat Risiko Awal: Tinggi. Lowongan meminta biaya modul onboarding di awal.",
      "confidence": 0.95
    }
  ],
  "salaryBenefit": {
    "title": "Kewajaran Gaji & Benefit",
    "status": "Tidak Wajar",
    "summary": "...",
    "highlights": ["..."],
    "hint": "..."
  },
  "risks": [
    {
      "type": "payment_request",
      "description": "Lowongan meminta pelamar membayar biaya modul onboarding.",
      "evidence": "Wajib bayar biaya modul onboarding Rp 150.000."
    }
  ],
  "summary": "...",
  "summaryCitations": [
    { "id": "src-S1", "label": "[1]", "title": "BCA Karir", "link": "https://karir.bca.co.id" }
  ],
  "explanations": [{ "title": "...", "explanation": "..." }],
  "suggestedQuestions": ["..."],
  "reasoning": [{ "intent": "Tahapan pemeriksaan TelaahKarier", "steps": ["..."] }],
  "references": [
    {
      "title": "BCA Karir",
      "url": "https://karir.bca.co.id",
      "snippet": "...",
      "citations": [{ "id": "src-S1", "label": "[1]", "title": "BCA Karir", "link": "https://karir.bca.co.id" }]
    }
  ],
  "mode": "ai"
}
```

| Field | Keterangan |
|---|---|
| `claims[0].riskLevel` | `rendah` / `sedang` / `tinggi`. Label terstruktur untuk evaluasi dan pewarnaan kartu. Prefix "Tingkat Risiko Awal: X." pada `text` selalu konsisten dengan field ini. |
| `claims` kosong | Materi belum cukup untuk dinilai. UI tidak menampilkan verdict maupun action chip. |
| `claims[0].confidence` | Keyakinan model, dibatasi maksimal 0.95 (tidak pernah tampil 100%). |
| `risks[].type` | `payment_request`, `sensitive_data`, `suspicious_contact`, `overclaim`, `missing_context`, `bias`, `tppo`, `manipulation`. |
| `risks[].evidence` | Kutipan dari materi. Untuk input teks, kutipan yang tidak ada di materi dibuang di server. |
| `summaryCitations` | Hanya sumber hasil pencarian web (ID `S1..Sn`). URL buatan model tidak pernah diteruskan. |
| `references` | Hasil pencarian yang **membahas entitas yang sama** (nama PT/CV atau domain). Jika tidak ada, berisi rujukan verifikasi mandiri tanpa sitasi. |
| `salaryBenefit.status` | `Wajar` / `Perlu Diverifikasi` / `Tidak Wajar` / `Tidak Disebutkan`. Status `Tidak Disebutkan` hanya muncul di aksi gaji. |
| `mode` | `ai` = analisis model; `rule_fallback` = pemeriksaan terbatas berbasis aturan saat model tidak tersedia. |
| `material` | Apa yang dibaca analisis: `source` (`text` / `attachment` / `text_and_attachment`), `transcript` teks lampiran, `legibility`, jenis tiap lampiran, `visualCues`, dan `entities` (nama perusahaan, gaji, lokasi, nomor, email, URL). Aksi dan tanya-jawab memakai transkrip ini; UI bisa menampilkannya agar salah baca terlihat. |

---

## ⚡ 2. UI Action Chips (`action-handler.ts`)

Semua aksi memakai structured output (`LLMActionOutputSchema`) dengan konteks berupa teks lowongan asli beserta transkrip lampirannya, hasil analisis awal, dan sumber pencarian yang sudah diverifikasi. Lampiran asli hanya dikirim ulang ke model jika keterbacaannya `sebagian`.

| Action ID | Deskripsi | Judul Output |
|---|---|---|
| `validate_company` | Identitas perusahaan: nama badan usaha, domain, jejak di sumber, cara cek (website resmi, LinkedIn, AHU Online). | *Checklist Validasi Perusahaan* |
| `check_red_flags` | Indikator mencurigakan yang benar-benar ada di materi, dengan kutipan. | *Indikator Mencurigakan yang Perlu Diwaspadai* |
| `check_link_contact` | Bedah tiap link, email, dan nomor kontak di materi. | *Analisis Risiko Link & Kontak* |
| `check_salary_benefit_reasonableness` | Kewajaran gaji/benefit dan kartu `data-salary-benefit` yang dihasilkan model. | *Checklist Kewajaran Gaji & Benefit* |
| `safe_next_steps` | Langkah aman spesifik terhadap risiko di materi. | *Langkah Aman Sebelum Bertindak* |

---

## 🧪 3. Pemakaian untuk Evaluasi

`runAnalysis(input, options)` di `web/langchain/agents/analyzer/analyze.ts` mengembalikan `{ result, meta }`.

- **Opsi ablation**: `useRules`, `useSearch`, `useLLM`, `useExtraction` (default semuanya `true`). `useExtraction: false` mengirim lampiran langsung ke analisis, untuk membandingkan jalur gambar sebelum dan sesudah tahap baca dulu.
- **`meta`** berisi: `mode`, `extraction` (status, jumlah lampiran, keterbacaan, model, waktu, token), sinyal aturan yang terdeteksi, status dan jumlah hasil pencarian, `riskFloorApplied`, `droppedSourceIds` (sitasi halusinasi yang dibuang), `droppedEvidence` (kutipan palsu yang dibuang), `timingsMs`, dan `tokenUsage`.
- **Model per tahap** diatur lewat env: `GEMINI_EXTRACTION_MODEL`, `GEMINI_ANALYSIS_MODEL`, `GEMINI_ROUTER_MODEL`, `GEMINI_FOLLOW_UP_MODEL`, `GEMINI_ACTION_MODEL` (jatuh ke `GEMINI_MODEL`, lalu `gemini-2.5-flash`). Lihat `web/.env.example`.
- Route `/api/chat` mencatat `meta` ini ke log server tanpa isi lowongan.
