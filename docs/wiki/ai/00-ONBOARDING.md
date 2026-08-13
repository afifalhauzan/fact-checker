# 🚀 00. Developer Onboarding: AI Engine

Panduan ini ditujukan bagi pengembang (developer) baru yang akan mengerjakan atau memelihara modul **AI Engine (TelaahKarier)**.

---

## 🛠️ 1. Prasyarat & Perangkat Lunak
- **Node.js**: v18.0.0 atau lebih baru.
- **Package Manager**: `pnpm` (disarankan) atau `npm`.
- **Framework**: Next.js 16 (App Router di folder `/web`).

---

## 🔑 2. Konfigurasi Environment Variable
Untuk menjalankan AI Engine secara lokal, kamu membutuhkan **Google Gemini API Key** dan **Tavily API Key**.

1. Buat file `.env.local` di dalam folder `web/`:
   ```bash
   cp web/.env.example web/.env.local
   ```
2. Isi variabel berikut:
   ```env
   # API Key Google Generative AI (Gemini)
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
   # atau opsi alternatif name:
   # GEMINI_API_KEY=your_gemini_api_key_here

   # Pilihan Model (Opsional, Default: gemini-2.5-flash)
   GEMINI_MODEL=gemini-2.5-flash

   # API Key Tavily (Pencarian Web Real-time)
   TAVILY_API_KEY=your_tavily_api_key_here
   ```

> 💡 **Catatan Model**: Anda bisa menggunakan model `gemini-2.5-flash`, `gemini-2.5-flash-lite`, atau `gemini-3.1-flash-lite` sesuai kuota Tier Gemini API Anda.

---

## 🏃 3. Menjalankan Server Lokal
Pindah ke direktori `/web` dan jalankan dev server:
```bash
cd web
pnpm install
pnpm run dev
```
Aplikasi akan berjalan di `http://localhost:3000`.

---

## 🧪 4. Menguji AI Engine
1. Buka Halaman Chat: `http://localhost:3000/chat`.
2. Tempelkan contoh teks lowongan kerja untuk dites:
   - **Teks Riskan / Penipuan**:
     > *"Lowongan kerja Admin Data Entry Remote. Gaji 7-9 juta/bulan. Tanpa ijazah. Pendaftaran via WA 08123456789. Wajib bayar biaya modul onboarding Rp 150.000."*
   - **Teks Perusahaan Resmi**:
     > *"Flip is a financial technology company in Indonesia... Hiring Senior Software Engineer."*
3. Periksa terminal tempat `pnpm run dev` berjalan untuk melihat log eksekusi Tavily Search & Structured LLM invocation.
