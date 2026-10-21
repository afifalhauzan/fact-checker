# 🤝 06. Dokumen Desain: Telaah Bersama

Status: **draf revisi 5, siap diimplementasikan** (21 Okt 2026). Semua keputusan tim tercatat di bagian 10.

Telaah Bersama adalah ruang publik berisi hasil telaah lowongan berisiko yang dibagikan pengguna. Pengguna lain bisa melihat Telaah, menandai bahwa mereka menerima lowongan atau chat yang sama, dan berdiskusi.

Saat pengguna mengirim materi lowongan, agent terlebih dahulu memeriksa apakah ada Telaah yang mirip. Jika ada, pengguna diberi pilihan: **membaca Telaah itu**, atau **tetap menelaah sendiri**. Pemeriksaan ini adalah **alat di luar engine telaah**. Fungsinya murni memotong biaya agar kasus yang sama tidak ditelaah ulang. Ada atau tidaknya Telaah yang mirip **tidak memengaruhi verdict** jika pengguna memilih menelaah sendiri.

---

## 1. Latar Belakang

- **Masukan latihan presentasi (Okt 2026):** produk dinilai terlalu sederhana karena hanya punya satu fitur, yaitu telaah di chat.
- **Celah kompetitor:** JobScamScore, Scamio, dan Real Job Check menilai satu lowongan untuk satu orang, lalu berhenti di skor. Tidak ada yang mempertemukan orang-orang yang menerima lowongan yang sama.
- **Akar masalah yang disasar:** penipu memakai *social proof* palsu. Bareskrim mencatat grup Telegram penipuan kerja paruh waktu berisi ratusan akun yang sebagian besar milik sindikat. Telaah Bersama memberi *social proof* tandingan yang nyata, misalnya: "7 orang menerima chat yang sama, 4 di antaranya kemudian diminta transfer."
- **Batasan dari tim:** fitur berjalan sendiri tanpa bergantung pada pihak tertentu seperti konselor, mitra, atau moderator. Isinya tumbuh dari telaah pengguna, dan moderasinya otomatis.

## 2. Tujuan dan Non-tujuan

**User story:**
1. Sebagai pencari kerja yang menerima chat recruiter, saya ingin tahu apakah orang lain menerima chat yang sama dan apa yang terjadi pada mereka.
2. Sebagai pengguna yang mendapat hasil telaah Sedang atau Tinggi, saya ingin membagikannya agar orang lain waspada, tanpa membuka data pribadi saya.
3. Sebagai pengunjung, saya ingin melihat lowongan yang sedang ramai ditelaah sebelum melamar ke mana pun.

**Non-tujuan:**
- Bukan media sosial umum dan bukan papan lowongan kerja.
- **Komentar dan reaksi tidak pernah mengubah tingkat risiko.** Verdict tetap milik engine telaah.
- Bukan pengganti pelaporan resmi. Jalur pelaporan disediakan oleh halaman Rujukan.
- **Konten tidak pernah dihapus karena usianya.** Telaah lama tetap menjadi bagian dari arsip informasi.

## 3. Cakupan MVP (untuk final)

| Masuk MVP | Ditunda |
|---|---|
| Pemeriksaan Telaah serupa sebelum pipeline telaah, dengan pilihan "baca Telaah" atau "telaah sendiri" (bagian 6.2) | Notifikasi ketika Telaah yang diikuti mendapat bukti baru |
| Tombol **Buat post?** hanya pada hasil telaah **Sedang/Tinggi** | Verifikasi perwakilan perusahaan lewat email berdomain perusahaan |
| Halaman **Buat Post**: judul dibuat AI dan bisa diedit, lampiran otomatis, peringatan data sensitif | Alat blur atau potong gambar di editor |
| Halaman daftar (**Ramai ditelaah** / **Terbaru**, filter modus dan risiko) dan halaman detail | Artikel cek fakta ikut diindeks sebagai sumber pencarian |
| **Diskusi** (komentar teks) dan reaksi **Saya juga menerima ini** | Pencarian teks bebas di halaman daftar |
| Laporan per jenis dengan penanganan otomatis (bagian 5.3) | Dashboard moderasi |
| Bagian **Ramai ditelaah** di beranda | |

## 4. Istilah

| Elemen | Istilah |
|---|---|
| Fitur / halaman | Telaah Bersama |
| Satu posting | Telaah (mis. "Telaah #128") |
| Tombol di hasil chat | Buat post? |
| Reaksi | Saya juga menerima ini |
| Kartu hasil pencarian di chat | Sudah ditelaah sebelumnya |
| Urutan ramai | Ramai ditelaah |
| Komentar | Diskusi |

Navigasi utama: `Mulai Telaah | Telaah Bersama | Rujukan`.

---

## 5. Kebijakan: Privasi, Konten, dan Penyalahgunaan

Bagian ini **memblokir implementasi**.

### 5.1 Siapa yang boleh membuat Telaah
- Tombol **Buat post?** hanya muncul pada hasil telaah dengan tingkat risiko **Sedang atau Tinggi**. Hasil Rendah, hasil tanpa verdict, dan obrolan biasa tidak bisa dijadikan post. Ini mencegah orang iseng yang hanya ingin membuat posting.
- Syarat ini **dicek di server**, bukan hanya di UI. Payload post berasal dari hasil analisis yang ditandatangani server (bagian 6.4), dan tingkat risikonya ikut ditandatangani.
- Kartu Telaah serupa (bagian 6.2) tidak punya tombol *Buat post?*, karena isinya bukan hasil telaah pengguna. Jika pengguna memilih *Tetap telaah sendiri* dan hasilnya Sedang/Tinggi, tombol *Buat post?* muncul seperti biasa.

### 5.2 Privasi (UU 27/2022 tentang Pelindungan Data Pribadi)

| Data | Perlakuan |
|---|---|
| **Semua data lowongan** Sedang/Tinggi: nomor kontak, email, domain, rekening tujuan, nama perusahaan, alamat kantor, dan lainnya | **Ditampilkan penuh.** Kesamaan nomor adalah bukti utama bahwa orang lain menerima penipuan dari sumber yang sama |
| NIK dan OTP/PIN (data milik pelamar, bukan data lowongan) | **Selalu disensor otomatis**, di materi maupun di cerita pengguna |
| Nama orang dan data pengguna sendiri (mis. nomornya terlihat di screenshot) | Tidak bisa dikenali andal secara otomatis. Ditangani lewat peringatan dan penghapusan baris atau lampiran oleh pengguna |
| Metadata gambar (EXIF, termasuk lokasi GPS) | Selalu dibuang di server saat lampiran disimpan |

Aturan tambahan:
- **Nama samaran.** Pembuat post dan komentator tampil sebagai nama samaran tetap, misalnya "Pencari Kerja #a3f", bukan nama akun.
- **Hak sunting dan hapus.** Pemilik bisa menyunting atau menghapus Telaah miliknya. Jika akunnya dihapus, Telaah tetap tampil secara anonim.
- **Peringatan data sensitif** ditampilkan di halaman Buat Post (bagian 6.5) dan sekali lagi di dialog konfirmasi sebelum post terbit.

### 5.3 Laporan dan penanganannya

Tidak ada Telaah yang dihapus otomatis. Penanganannya bergantung pada jenis laporan:

| Jenis laporan | Penanganan otomatis |
|---|---|
| **Data pribadi bocor** | Server memindai ulang teks dan transkrip lampiran dengan modul sensor (bagian 6.3). **Jika ditemukan pola sensitif**, Telaah disembunyikan sementara sampai pemiliknya menyunting. **Jika tidak ditemukan**, laporan hanya dicatat sebagai label. Pengaman ini mencegah penipu menyembunyikan Telaah yang membongkar nomor mereka dengan laporan palsu |
| **Spam / tidak relevan** | Hanya label "Dilaporkan sebagai spam (N)" |
| **Lowongan ini asli** | Tampil sebagai tanggapan yang terlihat, misalnya "3 orang menyatakan lowongan ini asli", lengkap dengan alasannya jika diisi. Telaah tidak disembunyikan |

Batasan: maksimal satu laporan per akun per Telaah, dan hanya akun berumur ≥ 1 hari yang laporannya dihitung.

### 5.4 Konten dan pencemaran nama baik
Engine kita masih bisa keliru. Pada set `test`, 29 dari 50 lowongan asli dinilai Sedang, dan ada satu alarm palsu Tinggi (A024). Karena itu:
- Halaman detail selalu menampilkan **"Ini penilaian awal, bukan vonis"** di dekat tingkat risiko.
- Judul dibuat AI dengan bahasa netral (bagian 6.5). Jika pengguna menyunting judul dengan kata menuduh seperti "penipu" atau "scam", muncul peringatan lunak yang menyarankan kata "terindikasi".
- Tanggapan "lowongan ini asli" selalu terlihat (bagian 5.3).

### 5.5 Model penyalahgunaan

| Ancaman | Penanganan otomatis |
|---|---|
| Akun sindikat berkomentar "aman kok, saya sudah digaji" | Komentar tidak memengaruhi verdict. Komentar yang mengarahkan penilaian ditandai **"Klaim tanpa bukti"** memakai logika manipulasi di `signals.ts` yang diperluas ke arah "aman". Akun berumur < 7 hari diberi lencana "akun baru". |
| Banjir post | Hanya hasil Sedang/Tinggi yang bisa diposting. Rate limit 5 post/hari dan 20 komentar/jam per akun. |
| Memalsukan verdict untuk menuduh perusahaan asli | Verdict, bukti, dan materi lowongan berasal dari payload bertanda tangan server dan tidak bisa diubah (bagian 6.4) |
| Melampirkan gambar lain yang tidak pernah dianalisis | Hanya gambar yang hash-nya ada di payload bertanda tangan yang diterima |
| Laporan massal untuk menyembunyikan Telaah | Lihat pengaman di bagian 5.3 |
| XSS di komentar | Komentar dirender sebagai teks biasa |

---

## 6. Desain Teknis

### 6.1 Gambaran alur

```
[Materi lowongan baru di chat]  route.ts
  A. baca lampiran (extractAttachments, sudah ada)
  B. PERIKSA TELAAH SERUPA  (alat baru, di luar runAnalysis)
       ├─ ada yang mirip → kartu "Sudah ditelaah sebelumnya" (+ sinyal aturan dari materi pengguna)
       │     pilihan: [Baca Telaah]  [Tetap telaah sendiri]
       │     runAnalysis TIDAK dipanggil → biaya web search + LLM penilai dihemat
       │     └─ "Tetap telaah sendiri" → C, tanpa informasi apa pun dari Telaah yang cocok
       └─ tidak ada yang mirip → C
  C. runAnalysis()  ← TIDAK DIUBAH (aturan → web search → LLM → risk floor/cap)
       └─ jika Sedang/Tinggi: payload post bertanda tangan → tombol "Buat post?"

[Buat post]  /telaah-bersama/buat → Next /api/telaah-bersama (verifikasi) → Laravel
[Lihat / diskusi]  Next proxy → Laravel (publik untuk baca, login untuk menulis)
```

**Engine telaah tidak diubah, sehingga evaluasi verdict tidak perlu diperbarui.** Satu-satunya perubahan di sekitar engine: `runAnalysis` menerima hasil baca lampiran yang sudah ada sebagai parameter opsional, supaya lampiran tidak dibaca dua kali. Jika parameter itu tidak diisi, perilakunya identik dengan sekarang. Eval tidak memakai parameter ini.

### 6.2 Pemeriksaan Telaah serupa (alat di luar engine)

**Tujuan:** memotong biaya. Jika lowongan yang sama sudah pernah ditelaah dan dibagikan, Telaah itu ditawarkan **sebelum** web search dan LLM penilai dijalankan. Pengguna tetap bebas meminta telaah sendiri, dan verdictnya tidak dipengaruhi oleh Telaah yang cocok.

**Kapan dijalankan:** asumsinya **satu sesi chat = satu lowongan yang ditelaah**. Pemeriksaan dijalankan sekali, pada **materi lowongan pertama di sesi**. Pemeriksaan tidak dijalankan untuk pesan berikutnya di sesi itu (pertanyaan lanjutan, klik chip aksi, materi tahap berikutnya dari lowongan yang sama) dan tidak dijalankan setelah pengguna memilih *Tetap telaah sendiri*.

**Langkah (bertingkat, supaya murah ketika tidak ada yang mirip):**
1. **Pengenal persis.** Nomor HP, email, rekening, dan domain non-generik diambil dengan regex, dinormalisasi, lalu dicari lewat indeks. Tidak ada biaya model.
2. **Embedding.** Materi tersensor diubah menjadi embedding, lalu dicari k = 10 tetangga terdekat lewat indeks HNSW pgvector. Biaya embedding jauh lebih kecil daripada web search + LLM penilai.
3. **Atribut, hanya jika ada kandidat.** Jika langkah 1 atau 2 menghasilkan kandidat (pengenal sama atau cosine ≥ ambang awal), model ringan mengekstrak atribut dari materi pengguna dalam format yang sama dengan atribut Telaah (bagian 6.6). Tanpa kandidat, langkah ini dilewati. Atributnya:

   | Atribut | Contoh | Catatan |
   |---|---|---|
   | **Periode pendaftaran** (tanggal dibuka – ditutup) | 1–30 Okt 2026 | Atribut tanggal yang paling penting |
   | **Nomor kontak, email, rekening** | 0812-3456-7890 | Juga dipakai sebagai pengenal persis di langkah 1 |
   | **Sumber lowongan** | Instagram @loker.bumn.id, grup WA, situs `rekrutmen-pln.com` | Platform + akun/URL asal, jika terlihat di materi |
   | Perusahaan / instansi | PT PLN (Persero) | Dinormalisasi (tanpa "PT", "Tbk", "Persero") |
   | Posisi | Staff Admin | |
   | Lokasi | Jakarta | |
   | Gaji | Rp6.000.000 | |

4. **Skor gabungan:**
   `skor = w1·cosine + w2·[pengenal sama] + w3·kecocokan atribut`.
   Kecocokan atribut dihitung per atribut: periode pendaftaran, sumber lowongan, perusahaan, posisi, lokasi, gaji. Bobot dan ambangnya dikalibrasi dengan uji pencocokan (bagian 7.2).
   - **Periode pendaftaran yang tumpang-tindih** menaikkan skor dan mempersempit pencarian.
   - Periode yang tidak tumpang-tindih menurunkan skor tetapi tidak otomatis membatalkan, karena penipu sering menyebar ulang template yang sama dengan tanggal baru. Telaah seperti itu ditampilkan dengan keterangan *"versi sebelumnya, periode berbeda"*.
5. **Pengaman lowongan resmi.** Kandidat dibatalkan jika materi pengguna memuat domain resmi perusahaan (non-generik, bukan domain gratis) yang **berbeda** dari domain di Telaah, sementara nama perusahaannya sama. Ini pola klasik lowongan resmi vs lowongan palsu yang mencatut perusahaan yang sama.
6. **Ambil hanya 1 Telaah termirip** dengan skor ≥ ambang. Jika tidak ada, `runAnalysis` langsung berjalan.

**Tampilan jika ada Telaah yang mirip:**
- Kartu **Sudah ditelaah sebelumnya** berisi:
  - judul,
  - **tingkat risiko dan bukti dari Telaah itu** (dengan label "dinilai pada {tanggal}"),
  - jumlah "Saya juga menerima ini",
  - cuplikan diskusi,
  - alasan kecocokan, misalnya "nomor WA sama" atau "perusahaan, posisi, dan periode pendaftaran sama".
- **Sinyal aturan dari materi pengguna sendiri.** `detectSignals` dipanggil langsung (deterministik, tanpa biaya model), lalu sinyal kuat ditampilkan, misalnya permintaan transfer yang tidak disebut di Telaah.
- Pilihan, memakai ulang part `interactive-step` dan komponen `InteractiveStep` yang sudah ada. **Catatan:** `handleInteractiveChoice` di `web/contexts/StreamingContext.tsx` saat ini masih kosong ("not used in simplified mode"), sehingga klik pilihan belum melakukan apa pun. Handler ini wajib diimplementasikan, dan dipakai juga oleh bagian 6.11.
  - **[Baca Telaah]**: membuka halaman Telaah, tempat pengguna bisa menekan *Saya juga menerima ini* dan ikut berdiskusi.
  - **[Tetap telaah sendiri]**: `runAnalysis` berjalan pada materi yang sama **tanpa informasi apa pun dari Telaah yang cocok**, sehingga verdictnya independen.
- `match_count` Telaah bertambah saat kartu tampil, maksimal sekali per pengguna/IP per hari.

**Sesi lanjutan.** Telaah yang cocok dicatat sebagai **sumber sesi**. Pertanyaan lanjutan di sesi itu (`follow-up.ts`) boleh merujuk Telaah tersebut, ditandai `[T1]`, di samping sumber web. Telaah itu tidak pernah masuk ke `runAnalysis`. Untuk mendukung ini, `findPostingContext` di `conversation-context.ts` diperluas agar bisa membaca part kartu Telaah sebagai konteks ketika belum ada analisis di sesi.

**Letak kode.** Modul terpisah, misalnya `web/langchain/agents/telaah-bersama/similar.ts`, **di luar folder `analyzer/`**, untuk menegaskan bahwa ini bukan bagian engine. Orkestrasinya ada di `route.ts`. Batas waktu 2 detik; jika gagal, `runAnalysis` langsung berjalan.

### 6.3 Sensor data sensitif (prasyarat)
Modul baru `web/langchain/agents/analyzer/redaction.ts` berisi fungsi murni dengan uji unit. Saat ini **belum ada sensor apa pun di repo**.

| Data | Deteksi | Perlakuan |
|---|---|---|
| NIK | 16 digit, diawali kode provinsi yang valid | Disensor: `[NIK disensor]` |
| OTP / PIN | 4–6 digit di dekat "kode/OTP/PIN/verifikasi" | Disensor: `[kode disensor]` |
| Nomor HP, email, rekening, domain | Pola masing-masing | **Tidak disensor** (bagian 5.2), tetapi dinormalisasi untuk pencocokan |
| URL | – | Query string dibuang karena sering berisi token |
| Pola "mungkin data pribadi" di transkrip lampiran (NIK, tanggal lahir, alamat lengkap) | Pola | Lampiran diberi **peringatan khusus** di halaman Buat Post |

Modul yang sama nantinya dipakai untuk menyensor teks sebelum dikirim ke Gemini/Tavily. **Penerapan itu adalah perubahan engine terpisah** yang wajib diikuti uji ulang `dev` dan injeksi.

### 6.4 Payload bertanda tangan
Status `data-analysis` yang tersimpan di `messages.meta_data` **berasal dari klien** ([chat-persistence.ts](../../../web/lib/chat-persistence.ts)), sehingga tidak bisa dipercaya untuk konten publik. Karena itu:
1. Setelah hasil Sedang/Tinggi, [route.ts](../../../web/app/api/chat/route.ts) membangun payload:
   - tingkat dan jenis risiko, bukti, ringkasan, modus, nama perusahaan,
   - materi lowongan tersensor per baris,
   - daftar link dari materi,
   - **hash SHA-256 setiap lampiran yang dianalisis**,
   - pengenal yang sudah dinormalisasi.
2. Payload ditandatangani dengan `HMAC-SHA256(TELAAH_SIGNING_KEY, JSON kanonis)` dan dikirim sebagai part `data-telaah-share`. Kuncinya hanya ada di server Next.js.
3. Saat post dikirim, rute Next memverifikasi:
   - tanda tangan,
   - bahwa materi final adalah **subsekuens baris** dari materi yang ditandatangani (hanya boleh menghapus),
   - bahwa setiap lampiran memiliki hash yang ada di payload,
   - bahwa link final adalah subset dari link di payload.

   Setelah itu, rute menghitung embedding dari materi final, lalu memanggil Laravel dengan token pengguna **dan** header `X-Internal-Key`. Endpoint pembuatan Telaah menolak permintaan tanpa kunci ini.

### 6.5 Halaman Buat Post (`/telaah-bersama/buat`)

| Bagian | Isi awal | Bisa diedit? |
|---|---|---|
| **Judul** | Dibuat AI dari hasil percakapan (bagian 6.6) | Ya, maksimal 120 karakter |
| **Sumber lowongan** | Diisi AI dari materi (platform + akun/URL asal), atau kosong | Ya, misalnya memilih platform dan mengisi akun asal. Field ini ikut dipakai untuk pencocokan |
| **Cerita kamu** (opsional) | Kosong, dengan contoh: "Saya dihubungi lewat WA setelah melamar di…" | Ya. NIK/OTP disensor otomatis saat dikirim |
| **Materi lowongan** | Transkrip tersensor, per baris | **Terkunci**, hanya bisa menghapus baris |
| **Lampiran** | Gambar dari pesan yang dianalisis, otomatis terlampir | Hanya bisa dihapus. Gambar dengan pola data pribadi diberi peringatan |
| **Link** | Link dari materi, otomatis terlampir | Hanya bisa dihapus |
| **Tingkat risiko dan bukti** | Dari hasil telaah | **Terkunci** (hanya ditampilkan) |
| **Persetujuan** | Centang: "Saya sudah memeriksa tidak ada data pribadi saya atau orang lain di post ini" | Wajib dicentang |

**Peringatan data sensitif** tampil di bagian atas halaman, di setiap lampiran yang terdeteksi berisiko, dan di dialog konfirmasi terakhir.

**Lampiran dari percakapan lama:** gambar saat ini tidak disimpan setelah halaman dimuat ulang. Persistensi mengganti lampiran dengan teks `[Lampiran: …]`. Jadi lampiran hanya otomatis terlampir jika post dibuat di sesi yang sama dengan telaahnya. Untuk percakapan lama, pengguna **mengunggah ulang file yang sama**, lalu server mencocokkan hash-nya dengan payload. File yang hash-nya berbeda ditolak.

### 6.6 Judul dan atribut buatan AI
- Panggilan model ringan, misalnya `stage: "title"` di `llm.ts` dengan model *flash-lite*. Masukannya materi tersensor dan ringkasan percakapan.
- **Keluaran terstruktur:**
  `{ perusahaan, posisi, tanggal_dibuka, tanggal_ditutup, lokasi, gaji, sumber_platform, sumber_akun, judul }`.
  Setiap field boleh kosong jika memang tidak disebut di materi.
- **Isi judul hanya informasi netral dari materi:** nama entitas, posisi, periode pendaftaran, dan info netral lain seperti lokasi.
  Contoh: *"Lowongan PT PLN · Staff Admin · Jakarta · 1–30 Okt 2026"*.
  Judul tidak memuat penilaian (tingkat risiko sudah tampil sebagai lencana), tidak memuat kata "penipuan/palsu/scam", dan tidak memuat data pribadi.
- **Atribut yang sama disimpan di Telaah** (bagian 6.8) dan dipakai untuk pencocokan (bagian 6.2 langkah 3–4).
- **Validasi terhadap materi:**
  - Tanggal divalidasi ulang dengan pola tanggal dari `dates.ts`. Tanggal yang tidak muncul di materi dibuang, sehingga model tidak bisa mengarang tanggal.
  - Akun atau URL sumber yang tidak muncul di materi juga dibuang.
- **Fallback deterministik** jika model gagal: `Lowongan {nama perusahaan dari extractCompany | "tanpa nama perusahaan"}`.
- Panggilan ini tidak memengaruhi verdict.

### 6.7 Penyimpanan: pgvector
- Image Postgres sendiri: `docker/postgres/Dockerfile` dengan `FROM postgres:17-alpine`, lalu memasang pgvector dari source. Versi rilis dipin saat implementasi.
- Basis image **tetap sama** dengan yang dipakai sekarang, sehingga volume `pgdata` di VPS aman dari perbedaan *collation*. `docker-compose.yml` diubah dari `image:` menjadi `build:`, dan `deploy.ps1` perlu ikut membangun image.
- Migrasi: `CREATE EXTENSION IF NOT EXISTS vector`, kolom `embedding vector(768)`, dan indeks `HNSW (embedding vector_cosine_ops)`. Jika versi Laravel yang terpasang belum punya tipe kolom `vector`, migrasi memakai `DB::statement`.
- **Dimensi 768.** Indeks HNSW pgvector maksimal 2.000 dimensi, sementara keluaran bawaan embedding Gemini lebih besar. Model embedding Gemini dipanggil dengan `outputDimensionality: 768`. Dukungan parameter ini di `@langchain/google-genai` dicek saat implementasi; jika tidak didukung, panggil REST API langsung.

### 6.8 Model data (Laravel)

```
telaah_posts
  id (uuid), user_id (nullable, null-on-delete), status (visible|hidden_pending_edit)
  title, story (text, nullable), material_masked (longText), summary (text)
  risk_level (sedang|tinggi), risk_types (json), modus (nullable), evidence (json)
  company_name, position, location, salary (nullable)
  open_date, close_date (date, nullable), source_platform, source_account (nullable)
  links (json), embedding vector(768)
  match_count, reaction_count, comment_count (int, default 0), hot_score (float)
  is_seed (bool), created_at, updated_at
  index (status, hot_score), index (status, created_at), index (company_name, open_date), hnsw (embedding)

telaah_identifiers
  id, post_id (fk cascade), kind (phone|email|account|domain), value (normalized)
  index (kind, value)

telaah_attachments
  id, post_id (fk cascade), path, sha256, mime, size, hidden (bool)

telaah_comments
  id, post_id (fk cascade), user_id (null-on-delete), body (text), flag (null|klaim_tanpa_bukti), timestamps

telaah_reactions
  post_id, user_id, kind ('juga_menerima'), created_at; unique (post_id, user_id, kind)

telaah_reports
  post_id, user_id, type (data_pribadi|spam|lowongan_asli), note (nullable), created_at
  unique (post_id, user_id)
```

Kolom `users` perlu tambahan `pseudonym` (dibangkitkan sekali, unik).

**Skor ramai (gaya Hacker News):**
`hot_score = (2·reaction_count + comment_count + match_count) / (jam_sejak_dibuat + 2)^1.5`.
Skor dihitung ulang setiap kali ada reaksi, komentar, atau kecocokan. Telaah lama tidak pernah dihapus; skornya saja yang turun. Halaman detail menampilkan "Ditelaah {X} bulan lalu" sebagai konteks.

### 6.9 API

Laravel (`api/routes/api.php`):

| Metode & rute | Akses | Fungsi |
|---|---|---|
| `GET /telaah-bersama?sort=ramai\|terbaru&modus=&risk=` | publik | Daftar Telaah (paginasi) |
| `GET /telaah-bersama/{id}` | publik | Detail + diskusi + tanggapan |
| `POST /telaah-bersama` | login + kunci internal | Buat Telaah dari payload terverifikasi (multipart, dengan lampiran) |
| `PATCH /telaah-bersama/{id}` | pemilik | Sunting judul/cerita, hapus baris atau lampiran |
| `DELETE /telaah-bersama/{id}` | pemilik | Hapus Telaah sendiri |
| `POST /telaah-bersama/{id}/comments` | login, throttle | Tambah komentar |
| `POST /telaah-bersama/{id}/reactions` | login | Saya juga menerima ini (toggle) |
| `POST /telaah-bersama/{id}/reports` | login | Laporan per jenis (bagian 5.3) |
| `POST /telaah-bersama/similar` | kunci internal | Kandidat dari pengenal + embedding (+ atribut jika ada), lalu kembalikan 1 Telaah termirip beserta skor dan alasannya |
| `POST /telaah-bersama/{id}/matched` | kunci internal | Naikkan `match_count` (maksimal sekali per pengguna/IP per hari) |

Next.js: `web/app/api/telaah-bersama/**` sebagai proxy dengan pola `backendFetch` di [server-auth.ts](../../../web/lib/server-auth.ts).

**Variabel lingkungan baru:**
- `TELAAH_SIGNING_KEY`: hanya di Next.
- `TELAAH_INTERNAL_KEY`: di Next dan Laravel.

### 6.10 Antarmuka
- **Hasil telaah di chat:**
  - Untuk kasus baru dengan hasil Sedang/Tinggi: tombol sekunder **Buat post?** di bawah kartu risiko, yang membuka `/telaah-bersama/buat`. Maksimal satu tombol utama per kartu, mengikuti pelajaran misclick.
  - Jika ada Telaah yang mirip: kartu **Sudah ditelaah sebelumnya** dengan pilihan [Baca Telaah] / [Tetap telaah sendiri] (bagian 6.2).
- **`/telaah-bersama`:** tab *Ramai ditelaah* / *Terbaru*, filter modus dan risiko, dan kartu ringkas yang memakai ulang gaya `RiskCard`.
- **`/telaah-bersama/[id]`:** judul, lencana risiko, "Ini penilaian awal, bukan vonis", materi, cerita, lampiran, link, bukti, tanggapan "lowongan ini asli", tautan ke bagian Rujukan yang relevan, *Diskusi*, dan tombol lapor.
- **Beranda:** bagian *Ramai ditelaah* (maksimal 3 Telaah).
- **Tamu:** bisa membaca Telaah Bersama dan melihat kartu Telaah serupa di chat, tetapi wajib login untuk membuat post, berkomentar, bereaksi, dan melapor.

### 6.11 Lowongan kedua dalam satu sesi
Satu sesi menampung satu lowongan (keputusan 13). Jika pengguna mengirim materi lowongan lagi di sesi yang sudah punya telaah, agent harus membedakan dua kemungkinan:
- **lanjutan dari lowongan yang sama**, misalnya chat HRD, undangan tes, atau offer letter setelah poster,
- **lowongan lain**.

**Deteksi: perluasan turn router (layer orkestrator).** Keputusan "lanjutan atau lowongan baru" diambil oleh router yang sudah ada ([turn-router.ts](../../../web/langchain/agents/analyzer/turn-router.ts)), yang kini berperan sebagai orkestrator giliran. Tidak ada modul deteksi terpisah.
- **Skema keluaran router** diperluas dari `materi_lowongan | pertanyaan` menjadi:
  - `pertanyaan`: dijawab oleh `follow-up.ts`, seperti sekarang,
  - `materi_lanjutan`: materi tahap berikutnya dari lowongan sesi, sehingga pipeline berjalan seperti sekarang,
  - `lowongan_baru`: materi lowongan lain, sehingga muncul peringatan pindah sesi.

  Tanpa telaah sebelumnya di sesi, `materi_lanjutan` dan `lowongan_baru` sama-sama diperlakukan sebagai materi pertama.
- **Konteks untuk router.** Ringkasan analisis 200 karakter yang dipakai sekarang belum cukup. Router juga diberi atribut lowongan sesi (perusahaan, posisi, periode, kontak) dan **bukti deterministik**, misalnya "nomor WA di pesan baru sama dengan lowongan sesi".
- **Jalan pintas tanpa LLM.** Jika ada pengenal yang sama (nomor, email, rekening, domain) dengan lowongan sesi, hasilnya langsung `materi_lanjutan`.
- **Kapan router dipanggil.** Saat ini router dilewati untuk pesan bergambar dan teks > 500 karakter. Jika sesi sudah punya telaah, router **tetap dipanggil** untuk pesan seperti itu. Untuk gambar, router membaca transkrip dari tahap baca lampiran, yang hasilnya dipakai ulang oleh pipeline (bagian 6.1).
- **Arah aman ketika ragu.** Prompt router menegaskan bahwa jika ragu, pilih `materi_lanjutan`. Peringatan pindah sesi hanya muncul untuk lowongan yang jelas berbeda, supaya pengguna yang sedang memproses satu lowongan secara bertahap tidak terus-menerus diganggu.
- **Uji.** Perubahan prompt router memengaruhi pemilahan pertanyaan vs materi yang sudah berjalan. Karena itu, set uji kecil router (bagian 7.1) juga mencakup kasus `pertanyaan` dan `materi_lanjutan` yang selama ini benar, supaya tidak terjadi regresi.

**Jika terdeteksi beda:**
- Pipeline **tidak dijalankan**, sehingga tidak ada biaya web search maupun LLM penilai.
- Agent membalas dengan peringatan dan pilihan (`interactive-step`):
  > *"Sepertinya ini lowongan lain dari yang sedang dibahas. Supaya konteksnya tidak tercampur, pindahkan ke sesi baru?"*
  > **[Ya, pindahkan ke sesi baru]** **[Tidak, ini lowongan yang sama]**
- **Ya:**
  - klien membuat sesi baru (`handleCreateNewSession` yang sudah ada),
  - lalu **memindahkan input** (teks dan lampiran) ke sesi baru dengan pola draf yang sama seperti [landing-chat-handoff.ts](../../../web/lib/landing-chat-handoff.ts),
  - lalu mengirimnya otomatis.

  Di sesi baru, pipeline berjalan dari awal, termasuk pemeriksaan Telaah serupa karena itu materi pertama sesi. Pesan yang dipindahkan dan balasan peringatannya **dihapus dari sesi lama** dan tidak dipersistenkan.
- **Tidak:** artinya detektor keliru, dan pengguna memang ingin memproses materi ini di sesi yang sama. Klien mengirim ulang pesan yang sama dengan penanda `same_posting: true`, sehingga `route.ts` melewati deteksi dan menjalankan pipeline seperti sekarang. Pilihan ini dicatat sebagai `choice-summary`.

**Persistensi.** Balasan peringatan ditandai, misalnya dengan part `data-session-move`. Klien menunda penyimpanan pasangan pesan itu sampai pengguna memilih. *Ya* berarti keduanya dibuang. *Tidak* berarti keduanya disimpan bersama hasil telaahnya.

**Pengukuran.** Setiap pilihan dicatat di log metadata `route.ts` (tanpa isi pesan). Pilihan *Tidak* adalah **peringatan palsu dari detektor**. Laju peringatan palsu ini metrik utama detektor, karena paling mengganggu pengguna yang sedang memproses lowongan yang sama secara bertahap.

**Tidak memengaruhi evaluasi verdict.** Router dan orkestrasi di `route.ts` berada di luar `runAnalysis`, dan eval memanggil `runAnalysis` secara langsung.

---

## 7. Rencana Kualitas

### 7.1 Uji unit (deterministik, gaya `eval/signals.test.ts`)
- Sensor: NIK dan OTP tersensor, sedangkan nomor HP, rekening, gaji, tanggal, dan kode pos **tidak** tersensor.
- Normalisasi pengenal: bentuk `+62`/`62`/`08` menghasilkan nilai yang sama.
- Verifikasi tanda tangan, aturan "materi hanya dikurangi", serta pencocokan hash lampiran dan subset link.
- Syarat Sedang/Tinggi: payload Rendah ditolak.
- Pengaman lowongan resmi (bagian 6.2 langkah 5).
- Validasi atribut: tanggal dan akun/URL sumber yang tidak ada di materi dibuang (bagian 6.6).
- Skor periode pendaftaran: tumpang-tindih menaikkan skor, tidak tumpang-tindih menurunkan skor tanpa membatalkan.
- Jalan pintas router (bagian 6.11): pengenal yang sama dengan lowongan sesi → `materi_lanjutan` tanpa panggilan LLM.
- Penanda `same_posting: true` melewati peringatan pindah sesi.

Selain uji unit, router diuji dengan set kecil berlabel (panggilan LLM sungguhan, data sintetis atau dari `dev`, bukan `test`):
- **tahap berbeda dari lowongan yang sama** (poster lalu chat HRD/offer letter) → harus `materi_lanjutan`,
- **lowongan berbeda** → harus `lowongan_baru`,
- **pertanyaan lanjutan dan materi pertama** yang selama ini sudah benar → tidak boleh berubah (regresi).

Prioritasnya adalah laju peringatan palsu yang rendah pada pasangan "lowongan yang sama".
- Penandaan komentar "klaim tanpa bukti".

### 7.2 Uji pencocokan (bukan evaluasi verdict)
Evaluasi verdict (protokol 05) **tidak perlu diperbarui**, karena engine telaah tidak berubah. Namun ambang kemiripan tetap harus dipilih berdasarkan data. Tanpa itu, kartu Telaah serupa bisa merujuk lowongan resmi ke Telaah lowongan palsu. Ini uji kecil yang terpisah, di set `dev` (**tidak memakai `test`**):
- **Indeks:** Telaah yang dibangkitkan dari kasus `dev`/`ambigu` bertingkat Sedang/Tinggi, sama seperti data awal demo (bagian 7.5).
- **Kueri positif:** varian dari template yang sama. Penipu menyebar ulang lowongan dengan sedikit perubahan (lihat 05, bagian 4). Varian diambil dari `dev`, `cadangan.csv`, dan `ambigu.csv`. Jika kurang, buat varian sintetis yang realistis: format nomor diubah, emoji dan baris diubah, teks dipotong, tanggal diperbarui.
- **Kueri negatif keras:** pasangan `pasangan_id`, yaitu lowongan **resmi** dari perusahaan yang lowongan palsunya ada di indeks.
- **Kueri negatif biasa:** lowongan lain yang tidak berhubungan.
- **Metrik:**
  - presisi kartu Telaah serupa,
  - **laju salah-rujuk pada lowongan resmi** (target 0),
  - recall,
  - biaya yang dihemat jika pengguna memilih *Baca Telaah*.
- **Ambang** dipilih pada presisi ≥ 0,95 dan laju salah-rujuk lowongan resmi = 0. Recall dilaporkan apa adanya.

### 7.3 Bukti bahwa engine tidak berubah
- Parameter opsional hasil baca lampiran (bagian 6.1) tidak dipakai oleh eval, dan bila tidak diisi perilakunya identik.
- Buktinya cukup: `pnpm test:signals` lolos, dan satu run `pnpm eval --split dev --variants aturan_saja` menghasilkan prediksi identik dengan run sebelumnya.

### 7.4 Keamanan
- Otorisasi: hanya pemilik yang bisa menyunting dan menghapus, dan endpoint internal menolak permintaan tanpa kunci.
- Payload dengan tanda tangan salah, materi yang ditambah, lampiran dengan hash asing, atau tingkat risiko Rendah ditolak.
- Unggahan: validasi tipe dan ukuran, EXIF dibuang, nama file dibuat server.
- XSS di komentar, rate limit, dan ukuran maksimal komentar.

### 7.5 Data awal untuk demo
Telaah Bersama diisi awal dari `dev` dan `ambigu` (**bukan `test`**), hanya yang bertingkat Sedang/Tinggi, dan ditandai `is_seed` dengan label **Contoh awal**. Saat presentasi, sampaikan dengan jujur bahwa isi ini contoh awal, bukan data pengguna nyata.

### 7.6 Metrik untuk laporan dan presentasi
- Presisi, recall, dan laju salah-rujuk lowongan resmi (7.2).
- Penghematan biaya per materi yang dicocokkan, dihitung dari rata-rata token dan biaya web search per telaah di laporan eval.
- Persentase materi baru yang mendapat kartu Telaah serupa, dan persentase pengguna yang memilih *Baca Telaah* dibanding *Tetap telaah sendiri*. Datanya dari log metadata di `route.ts`, mengikuti pola `[chat] analysis run`.
- Jumlah komentar yang ditandai dan jumlah laporan per jenis.

---

## 8. Pembagian Kerja

| Pemilik | Pekerjaan |
|---|---|
| Gaung (AI) | `redaction.ts` + uji; normalisasi pengenal; modul `telaah-bersama/similar.ts` (embedding, skor gabungan, pengaman lowongan resmi) dan orkestrasinya di `route.ts`; payload bertanda tangan; judul dan atribut buatan AI; uji pencocokan; konteks sesi untuk `follow-up.ts`; perluasan turn router (lanjutan vs lowongan baru) + set uji router; penandaan komentar |
| Afif (fullstack) | Image Postgres + pgvector dan `deploy.ps1`; migrasi dan endpoint Laravel (termasuk unggahan dan EXIF); proxy Next; halaman Buat Post, daftar, dan detail; kartu Telaah serupa; implementasi `handleInteractiveChoice`; pemindahan input ke sesi baru dan penundaan persistensi; bagian beranda |
| Rofi (PM) | Teks peringatan, persetujuan, dan "penilaian awal"; wireframe; skenario uji pengguna (masuk ke SUS ulang) |

## 9. Urutan Pengerjaan

1. **Sepakati bagian 11.**
2. **Sensor data sensitif** + uji unit (Gaung). Image pgvector, migrasi, dan kontrak API (Afif) berjalan paralel.
3. Payload bertanda tangan dan tombol *Buat post?*; halaman Buat Post (memakai judul fallback dulu); halaman daftar dan detail.
4. Judul dan atribut buatan AI, karena atribut ini juga dipakai untuk pencocokan.
5. `handleInteractiveChoice`; embedding dan endpoint `similar`; pemeriksaan Telaah serupa di `route.ts`; kartu Telaah serupa; konteks sesi untuk pertanyaan lanjutan; deteksi lowongan kedua dan pemindahan ke sesi baru.
6. Uji pencocokan dan kalibrasi ambang di `dev`.
7. Diskusi, reaksi, dan laporan; bagian beranda.
8. Data awal, uji keamanan, lalu **code freeze**. Tanggalnya ditetapkan setelah tenggat baru diumumkan.

Setelah langkah 3, fitur sudah bisa didemokan sebagai forum. Langkah 4–6 menambahkan pemeriksaan Telaah serupa yang memotong biaya.

## 10. Keputusan yang Sudah Disepakati (21 Okt 2026)

| # | Keputusan |
|---|---|
| 1 | Hanya hasil **Sedang/Tinggi** yang bisa dijadikan post, lewat tombol *Buat post?*. Judul dibuat AI dan bisa diedit. Lampiran dan link otomatis terlampir dan bisa dihapus. Ada peringatan data sensitif |
| 2 | **Semua data lowongan** Sedang/Tinggi ditampilkan penuh, termasuk nomor kontak dan rekening tujuan. NIK dan OTP milik pelamar tetap disensor |
| 3 | Pemeriksaan Telaah serupa adalah **alat di luar engine** yang dijalankan sebelum pipeline telaah. Hanya 1 Telaah termirip yang ditampilkan, lengkap dengan tingkat risikonya. Pengguna memilih *Baca Telaah* atau *Tetap telaah sendiri*. Telaah yang cocok **tidak memengaruhi verdict**. Tujuannya murni memotong biaya |
| 4 | Konten **tidak pernah dihapus** karena usianya. Laporan ditangani per jenis (bagian 5.3) |
| 5 | Penyimpanan embedding langsung memakai **pgvector** |
| 6 | Aturan sinyal deterministik tetap dijalankan dan ditampilkan di kartu Telaah serupa |
| 7 | Materi lowongan **terkunci** (hanya bisa menghapus baris); judul dan cerita bebas diedit |
| 8 | **Evaluasi verdict tidak diperbarui**, karena engine tidak berubah. Ambang kemiripan dipilih lewat uji pencocokan kecil (bagian 7.2) |
| 9 | Lampiran dari percakapan lama: **unggah ulang file yang sama**, dicocokkan dengan hash |
| 10 | Judul berisi informasi netral: **entitas, posisi, periode pendaftaran**, dan info netral lain |
| 11 | Telaah yang cocok menjadi **sumber sesi** untuk pertanyaan lanjutan, tetapi tidak masuk ke verdict |
| 12 | Atribut pencocokan: **periode pendaftaran** (bukan hanya tanggal penutupan), **nomor kontak**, **sumber lowongan**, perusahaan, posisi, lokasi, dan gaji |
| 13 | **Satu sesi chat = satu lowongan.** Pemeriksaan Telaah serupa hanya dijalankan pada materi pertama sesi |
| 14 | Artikel cek fakta eksternal ikut dicari **setelah MVP** |
| 15 | Lowongan kedua di satu sesi: **turn router diperluas menjadi orkestrator** yang memutuskan apakah materi itu lanjutan lowongan yang sama atau lowongan lain. Jika lain, pipeline ditahan dan muncul peringatan. *Ya* memindahkan input ke sesi baru lalu pipeline dimulai dari awal; *Tidak* menjalankan pipeline di sesi yang sama (bagian 6.11) |

## 11. Hal yang Masih Terbuka

Tidak ada untuk saat ini. Keputusan baru dicatat di bagian 10.
