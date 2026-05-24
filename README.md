# 🤖 BI Service Metabot: AI SDK Python Streaming & Generative UI

Repositori ini adalah implementasi **Data Stream Protocol** untuk melakukan streaming chat completions dari backend **FastAPI** (Python) dan menampilkannya menggunakan hook `useChat` pada aplikasi **Next.js**.

Proyek ini dioptimalkan untuk kebutuhan Business Intelligence (BI), memungkinkan pengiriman teks dan metadata grafik (Generative UI) secara *real-time*.

---

## 🏗️ Arsitektur Proyek

Proyek ini menggunakan struktur monorepo sederhana:

* **`/api`**: Backend FastAPI (Logic AI, Stream Protocol, Data Processing).
* **`/web`**: Frontend Next.js (TailwindCSS, Vercel AI SDK, Dashboard UI).

---

## 🚀 Persiapan & Instalasi Lokal

### 1. Prasyarat

* Node.js (direkomendasikan menggunakan `pnpm`).
* Python 3.9+.
* Docker & Docker Compose (untuk opsi deployment).

### 2. Konfigurasi Environment

Salin file `.env.example` menjadi `.env` di root direktori dan isi API Key yang diperlukan:

```bash
cp .env.example .env

```

### 3. Instalasi Dependency

**Frontend:**

```bash
cd web
pnpm install

```

**Backend (Python Virtual Environment):**

```bash
python -m venv venv
source venv/bin/activate  # Untuk Windows: venv\Scripts\activate
pip install -r api/requirements.txt

```

---

## 💻 Menjalankan Aplikasi

Frontend dijalankan dari direktori `web`, sedangkan backend dijalankan dari root proyek:

| Perintah | Deskripsi |
| --- | --- |
| `cd web && pnpm dev` | Menjalankan frontend Next.js di port `3000`. |
| `python -m uvicorn api.main:app --reload` | Menjalankan backend FastAPI di port `8000`. |
| `cd web && pnpm build` | Melakukan build produksi untuk aplikasi Next.js. |

---

## 🐳 Penggunaan Docker

Kami menyediakan dukungan Docker Compose untuk lingkungan pengembangan maupun produksi.

**Mode Pengembangan (Hot Reload):**

```bash
docker compose -f docker-compose.dev.yml up --build

```

**Mode Produksi:**

1. **Build Image:** `docker compose build`
2. **Menjalankan Container:** `docker compose up -d`
3. **Menghentikan Container:** `docker compose down`

**Log Monitoring:**

```bash
docker compose logs -f

```

---

## 🔗 API Contracts & Protokol

Aplikasi ini menggunakan **Vercel AI SDK Data Stream Protocol**. Dengan kontrak sudah didefinisikan dalam dokumen terpisah

---

## 🛠️ Pengembangan Lebih Lanjut

Untuk mempelajari lebih lanjut mengenai teknologi yang digunakan dalam proyek ini:

* [Dokumentasi AI SDK](https://sdk.vercel.ai/docs)
* [Dokumentasi FastAPI](https://fastapi.tiangolo.com)
* [Next.js Documentation](https://nextjs.org/docs)

Anda juga dapat mengakses Wiki terpisah di dalam Repositori ini untuk melihat dokumentasi teknis yang lebih rinci.

---

## 👥 Kontribusi & GitLab Flow

1. Buat **Issue** terlebih dahulu untuk setiap fitur atau bug fix.
2. Gunakan **Branch** dengan format `feat/nama-fitur` atau `fix/nama-bug`.
3. Buka **Merge Request (MR)** ke branch `dev-integration` untuk peninjauan kode oleh mentor/tim.

---

> **Note:** Pastikan `PYTHONPATH` sudah mengarah ke direktori `/app` saat menjalankan backend di dalam Docker agar modul `api` dapat terbaca dengan benar.

---
