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
pnpm install

```

**Backend (Python Virtual Environment):**

```bash
python -m venv venv
source venv/bin/activate  # Untuk Windows: venv\Scripts\activate
pip install -r requirements.txt

```

---

## 💻 Menjalankan Aplikasi

Anda dapat menggunakan skrip yang sudah didefinisikan di `package.json` untuk mempermudah orkestrasi:

| Perintah | Deskripsi |
| --- | --- |
| `pnpm dev` | Menjalankan Frontend & Backend secara bersamaan (Concurrently). |
| `pnpm fastapi-dev` | Menjalankan backend FastAPI saja di port `8000`. |
| `pnpm next-dev` | Menjalankan frontend Next.js saja di port `3000`. |
| `pnpm build` | Melakukan build produksi untuk aplikasi Next.js. |

---

## 🐳 Penggunaan Docker

Kami menyediakan dukungan Docker Compose untuk lingkungan pengembangan maupun produksi.

**Mode Pengembangan (Hot Reload):**

```bash
pnpm docker:dev

```

**Mode Produksi:**

1. **Build Image:** `pnpm docker:build`
2. **Menjalankan Container:** `pnpm docker:up`
3. **Menghentikan Container:** `pnpm docker:down`

**Log Monitoring:**

```bash
pnpm docker:logs

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