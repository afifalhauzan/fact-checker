<?php

namespace Database\Seeders;

use App\Models\Proyek;
use App\Models\User;
use App\Models\Jurusan;
use Illuminate\Database\Seeder;

class ProyekSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $siswaUsers = User::where('role', 'siswa')->get();

        $proyekDataFinal = [
            // --- RPL (ID 1) ---
            [
                'judul' => 'Sistem Informasi Absensi Berbasis QR',
                'deskripsi' => 'Aplikasi web menggunakan React dan Laravel untuk pencatatan kehadiran siswa dengan pemindaian QR Code.',
                'tautan_proyek' => 'https://github.com/bambangsudiro/absensi-qr',
                'image_url' => 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&h=300&fit=crop',
                'status' => 'dinilai',
                'nis_nip' => 'NIS020',
            ],
            [
                'judul' => 'Sistem Informasi Perpustakaan',
                'deskripsi' => 'Aplikasi web untuk mengelola data buku, peminjaman, dan pengembalian buku di perpustakaan sekolah. Dibuat menggunakan Laravel dan MySQL.',
                'tautan_proyek' => 'https://github.com/andipratama/sistem-perpustakaan',
                'image_url' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS021',
            ],
            [
                'judul' => 'E-Commerce Sederhana',
                'deskripsi' => 'Aplikasi jual-beli online untuk produk lokal. Fitur include katalog produk, keranjang belanja, dan sistem pembayaran sederhana. Dibuat dengan Next.js dan TailwindCSS.',
                'tautan_proyek' => 'https://github.com/dewisari/ecommerce-app',
                'image_url' => 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=300&fit=crop',
                'status' => 'dinilai',
                'nis_nip' => 'NIS022',
            ],

            // --- TKJT (ID 2) ---
            [
                'judul' => 'Monitoring Jaringan Komputer',
                'deskripsi' => 'Sistem monitoring untuk memantau status perangkat jaringan di lab komputer. Menggunakan SNMP untuk monitoring real-time.',
                'tautan_proyek' => 'https://github.com/rizkyramadhan/network-monitoring',
                'image_url' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS004',
            ],
            [
                'judul' => 'Konfigurasi Server Web',
                'deskripsi' => 'Dokumentasi dan implementasi konfigurasi server web dengan Apache, PHP, dan MySQL untuk hosting website sekolah.',
                'tautan_proyek' => 'https://github.com/mayasari/web-server-config',
                'image_url' => 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&h=300&fit=crop',
                'status' => 'dinilai',
                'nis_nip' => 'NIS005',
            ],
            [
                'judul' => 'Jaringan Wireless Skala Sekolah',
                'deskripsi' => 'Perancangan topologi dan konfigurasi jaringan wireless di lingkungan sekolah menggunakan Mikrotik.',
                'tautan_proyek' => 'https://github.com/cahyoutomo/wireless-skala-sekolah',
                'image_url' => 'https://images.unsplash.com/photo-1599385552718-450f375c35f6?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS006',
            ],

            // --- DKV (ID 3) ---
            [
                'judul' => 'Desain Identitas Brand Sekolah',
                'deskripsi' => 'Pembuatan logo, palet warna, dan panduan penggunaan visual untuk rebranding sekolah. Dibuat menggunakan Adobe Illustrator.',
                'tautan_proyek' => 'https://behance.net/jokosusilo/brand-design-smkn5',
                'image_url' => 'https://images.unsplash.com/photo-1544256718-3c306d8601c0?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS007',
            ],
            [
                'judul' => 'Infografis Pencegahan COVID-19',
                'deskripsi' => 'Rangkaian desain infografis edukatif untuk media sosial dan cetak, dibuat dengan Canva dan Adobe Photoshop.',
                'tautan_proyek' => 'https://dribbble.com/rinawati/covid-infographics',
                'image_url' => 'https://images.unsplash.com/photo-1620288229410-d0d473b18c5e?w=500&h=300&fit=crop',
                'status' => 'dinilai',
                'nis_nip' => 'NIS008',
            ],
            [
                'judul' => 'Prototype Aplikasi Mobile Sekolah',
                'deskripsi' => 'Desain UI/UX high-fidelity prototype aplikasi mobile informasi sekolah, dibuat menggunakan Figma.',
                'tautan_proyek' => 'https://www.figma.com/file/diankusuma/app-prototype',
                'image_url' => 'https://images.unsplash.com/photo-1626019554316-24e037c688c3?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS009',
            ],

            // --- Animasi (ID 4) ---
            [
                'judul' => 'Animasi Edukasi Bahaya Sampah',
                'deskripsi' => 'Video animasi 2D berdurasi 60 detik untuk kampanye kebersihan lingkungan. Dibuat dengan Adobe After Effects.',
                'tautan_proyek' => 'https://youtube.com/tomi-animasi-sampah',
                'image_url' => 'https://images.unsplash.com/photo-1588692795893-6c7c0f16e3b5?w=500&h=300&fit=crop',
                'status' => 'dinilai',
                'nis_nip' => 'NIS010',
            ],
            [
                'judul' => 'Motion Graphics Profil Sekolah',
                'deskripsi' => 'Video profil sekolah berdurasi 2 menit dengan gaya motion graphics yang dinamis. Diedit menggunakan Adobe Premiere Pro.',
                'tautan_proyek' => 'https://vimeo.com/lina-profil-sekolah',
                'image_url' => 'https://images.unsplash.com/photo-1558981408-db0ecd4a317e?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS011',
            ],

            // --- Kriya Kreatif Kayu & Rotan (ID 5) ---
            [
                'judul' => 'Desain Kursi Ergonomis Lipat',
                'deskripsi' => 'Perancangan dan pembuatan prototipe kursi belajar lipat yang ergonomis dari kayu jati Belanda.',
                'tautan_proyek' => 'https://instagram.com/slamet/kursi-lipat-kayu',
                'image_url' => 'https://images.unsplash.com/photo-1517436329497-2e1c3a6d9b9c?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS012',
            ],
            [
                'judul' => 'Maket Rumah Adat Jawa',
                'deskripsi' => 'Pembuatan maket miniatur rumah Joglo menggunakan teknik pahatan dan sambungan kayu tradisional.',
                'tautan_proyek' => 'https://drive.google.com/slamet/maket-rumah-adat',
                'image_url' => 'https://images.unsplash.com/photo-1582046808794-d4b65a5e305e?w=500&h=300&fit=crop',
                'status' => 'dinilai',
                'nis_nip' => 'NIS012',
            ],

            // --- Kriya Kreatif Batik & Tekstil (ID 6) ---
            [
                'judul' => 'Kain Batik Motif Flora Sekolah',
                'deskripsi' => 'Perancangan dan pembuatan kain batik tulis dengan motif flora khas lingkungan sekolah.',
                'tautan_proyek' => 'https://instagram.com/nisa-tekstil/batik-sekolah',
                'image_url' => 'https://images.unsplash.com/photo-1581005891393-2c1b1c1d1a1b?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS013',
            ],
            [
                'judul' => 'Taplak Meja Tenun Ikat Modern',
                'deskripsi' => 'Pembuatan taplak meja dengan teknik tenun ikat menggunakan pewarna alami dan desain modern minimalis.',
                'tautan_proyek' => 'https://shopee.co.id/nisa-tekstil/tenun-ikat',
                'image_url' => 'https://images.unsplash.com/photo-1587522533031-158c5f590b1e?w=500&h=300&fit=crop',
                'status' => 'dinilai',
                'nis_nip' => 'NIS013',
            ],

            // --- Kriya Kreatif Keramik (ID 7) ---
            [
                'judul' => 'Set Peralatan Makan Keramik Glaze',
                'deskripsi' => 'Pembuatan 4 set peralatan makan (piring, mangkuk, cangkir) dari keramik dengan teknik glazing warna-warni.',
                'tautan_proyek' => 'https://instagram.com/fajar-keramik/glaze-set',
                'image_url' => 'https://images.unsplash.com/photo-1563825838491-9e7314d3f5e5?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS014',
            ],
            [
                'judul' => 'Vas Bunga Abstrak dari Tanah Liat',
                'deskripsi' => 'Pembuatan vas bunga dengan bentuk non-tradisional menggunakan teknik hand-building dan tekstur kasar.',
                'tautan_proyek' => 'https://tokopedia.com/kriya-fajar/vas-abstrak',
                'image_url' => 'https://images.unsplash.com/photo-1601051515250-8b0b8c8d8c3f?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS014',
            ],

            // --- Desain dan Produksi Busana (ID 8) ---
            [
                'judul' => 'Perancangan Busana Pesta Malam',
                'deskripsi' => 'Desain dan pembuatan gaun pesta malam dengan teknik draperi dan aplikasi payet. Dilengkapi dengan dokumentasi proses menjahit.',
                'tautan_proyek' => 'https://instagram.com/gita-busana/gaun-pesta',
                'image_url' => 'https://images.unsplash.com/photo-1543888514-61c16928738b?w=500&h=300&fit=crop',
                'status' => 'terkirim',
                'nis_nip' => 'NIS015',
            ],
            [
                'judul' => 'Koleksi Busana Muslim Ready-to-Wear',
                'deskripsi' => 'Pembuatan 3 looks koleksi busana muslim harian yang nyaman dan trendi untuk pasar remaja.',
                'tautan_proyek' => 'https://shopee.co.id/gita-busana/koleksi-muslim',
                'image_url' => 'https://images.unsplash.com/photo-1583091001402-45e31e5f8b9e?w=500&h=300&fit=crop',
                'status' => 'dinilai',
                'nis_nip' => 'NIS015',
            ],
        ];

        foreach ($proyekDataFinal as $data) {
            $siswa = $siswaUsers->where('nis_nip', $data['nis_nip'])->first();

            if ($siswa) {
                // Remove nis_nip from data as it's not a column in proyeks table
                $dataProyek = $data;
                unset($dataProyek['nis_nip']);

                Proyek::create([
                    'user_id' => $siswa->id,
                    'jurusan_id' => $siswa->jurusan_id, // Use siswa's jurusan_id for consistency
                    'judul' => $dataProyek['judul'],
                    'deskripsi' => $dataProyek['deskripsi'],
                    'tautan_proyek' => $dataProyek['tautan_proyek'],
                    'image_url' => $dataProyek['image_url'],
                    'status' => $dataProyek['status'],
                ]);
            }
        }
    }
}