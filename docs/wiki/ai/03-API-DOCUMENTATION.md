# 📡 03. AI API Documentation

Dokumen ini merinci endpoint API dan kontrak data JSON untuk integrasi antara Frontend dan AI Engine.

---

## 🟢 1. Endpoint Utama: Analisis Lowongan & Chat

- **URL**: `/api/chat`
- **Method**: `POST`
- **Content-Type**: `application/json`

### A. Request Payload

#### Mode 1: Analisis Teks Lowongan Baru
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Lowongan kerja Admin Data Entry Remote. Gaji 7-9 juta/bulan. Tanpa ijazah. Pendaftaran via WA 08123456789. Wajib bayar biaya modul Rp 150.000."
    }
  ]
}
```

#### Mode 2: Eksekusi UI Action Chip (Aksi Lanjutan)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "check_red_flags"
    }
  ],
  "actionPayload": {
    "actionId": "check_red_flags",
    "context": "Teks lowongan Admin Data Entry Remote gaji 7-9 juta..."
  }
}
```

---

### B. Response Format (`AnalysisResult`)

```json
{
  "conversationText": "Halo! Saya telah menganalisis lowongan kerja yang Anda berikan...",
  "claims": [
    {
      "text": "Tingkat Risiko Awal: Tinggi. Ditemukan permintaan biaya di muka dan pendaftaran non-resmi via WhatsApp.",
      "confidence": 0.90
    }
  ],
  "salaryBenefit": {
    "title": "Kewajaran Gaji & Benefit",
    "status": "Perlu Diverifikasi",
    "summary": "Tawaran gaji 7-9 juta untuk posisi entry-level tanpa ijazah jauh di atas rata-rata industri.",
    "highlights": [
      "Gaji tidak realistis",
      "Syarat kualifikasi terlalu minim"
    ]
  },
  "risks": [
    {
      "type": "overclaim",
      "description": "Tawaran gaji sangat tinggi tanpa syarat ijazah sering digunakan sebagai umpan penipuan."
    },
    {
      "type": "bias",
      "description": "Kewajiban membayar biaya modul onboarding Rp 150.000 adalah indikator risiko penipuan yang sangat kuat."
    }
  ],
  "summary": "Lowongan kerja Admin Data Entry ini terindikasi memiliki risiko penipuan yang tinggi karena adanya biaya di muka.",
  "summaryCitations": [],
  "explanations": [
    {
      "title": "Permintaan Pembayaran di Muka",
      "explanation": "Perusahaan resmi tidak pernah meminta uang dari calon karyawan untuk pelatihan atau administrasi."
    }
  ],
  "suggestedQuestions": [
    "Apa nama perusahaan resmi yang membuka lowongan ini?",
    "Mengapa ada biaya modul onboarding?",
    "Apa langkah aman sebelum saya mengirimkan data pribadi?"
  ],
  "reasoning": [
    {
      "intent": "Menganalisis risiko lowongan kerja digital secara terstruktur",
      "steps": [
        "Mengevaluasi klaim gaji dan syarat kualifikasi",
        "Memeriksa indikator biaya administrasi",
        "Menyusun rekomendasi pencegahan"
      ]
    }
  ],
  "references": [
    {
      "title": "Halaman Karir Resmi Perusahaan",
      "url": "https://example.com/careers",
      "snippet": "Job posting details...",
      "citations": []
    }
  ]
}
```

---

## ⚡ 2. UI Action Chips (`action-handler.ts`)

| Action ID | Deskripsi | Judul Output |
|---|---|---|
| `validate_company` | Menghasilkan checklist verifikasi identitas perusahaan. | *Checklist Validasi Perusahaan* |
| `check_red_flags` | Merangkum indikator mencurigakan yang paling kritis. | *Indikator Mencurigakan yang Perlu Diwaspadai* |
| `check_link_contact` | Membedah risiko tautan shortlink dan kontak WhatsApp. | *Analisis Risiko Link & Kontak* |
| `check_salary_benefit_reasonableness` | Membandingkan gaji dengan standar entry-level. | *Checklist Kewajaran Gaji & Benefit* |
| `safe_next_steps` | Memberikan panduan rekomendasi tindakan praktis pencegahan. | *Langkah Aman Sebelum Bertindak* |
