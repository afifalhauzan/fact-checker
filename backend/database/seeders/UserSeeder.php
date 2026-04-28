<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Jurusan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        // Create admin user
        User::create([
            'name' => 'Admin SMKN 5',
            'email' => 'admin@smkn5.com',
            'nis_nip' => 'ADM001',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'jurusan_id' => null,
            'kelas_id' => null,
            'nis' => null,
            'gender' => 'L',
            'is_active' => true,
            'is_alumni' => false,
        ]);

        User::create([
            'name' => 'Kepsek SMKN 5 (Pak Kepala Sekolah)',
            'email' => 'kepsekadmin@smkn5.com',
            'nis_nip' => 'ADM002',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'jurusan_id' => null,
            'kelas_id' => null,
            'nis' => null,
            'gender' => 'L',
            'is_active' => true,
            'is_alumni' => false,
        ]);

        // Create guru users
        $gurus = [
            [
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@smkn5.com',
                'nis_nip' => 'NIP001',
                'password' => Hash::make('password'),
                'role' => 'guru',
                'jurusan_id' => 1, // Guru RPL
                'kelas_id' => null, 
                'nis' => null,    
                'gender' => 'L',
                'is_active' => true,
                'is_alumni' => false,
            ],
            [
                'name' => 'Dimas Santoso',
                'email' => 'dimas.santoso@smkn5.com',
                'nis_nip' => 'NIP002',
                'password' => Hash::make('password'),
                'role' => 'guru',
                'jurusan_id' => 2, // Contoh: Ketua Jurusan TKJ
                'kelas_id' => null, // Guru tidak terikat pada satu kelas
                'nis' => null,      // Guru tidak memiliki NIS
                'gender' => 'L',
                'is_active' => true,
                'is_alumni' => false,
            ],
            [
                'name' => 'Amilia',
                'email' => 'amilia@smkn5.com',
                'nis_nip' => 'NIP003',
                'password' => Hash::make('password'),
                'role' => 'guru',
                'jurusan_id' => 3, // Contoh: Guru DKV
                'kelas_id' => null, // Guru tidak terikat pada satu kelas
                'nis' => null,      // Guru tidak memiliki NIS
                'gender' => 'P',
                'is_active' => true,
                'is_alumni' => false,
            ],
            [
                'name' => 'Santi',
                'email' => 'santi@smkn5.com',
                'nis_nip' => 'NIP004',
                'password' => Hash::make('password'),
                'role' => 'guru',
                'jurusan_id' => 4, // Contoh: Ketua Jurusan Animasi
                'kelas_id' => null, // Guru tidak terikat pada satu kelas
                'nis' => null,      // Guru tidak memiliki NIS
                'gender' => 'P',
                'is_active' => true,
                'is_alumni' => false,
            ],
            [
                'name' => 'Handi Santoso',
                'email' => 'handi.santoso@smkn5.com',
                'nis_nip' => 'NIP005',
                'password' => Hash::make('password'),
                'role' => 'guru',
                'jurusan_id' => 5, // Contoh: Ketua Jurusan Kriya Kayu
                'kelas_id' => null, // Guru tidak terikat pada satu kelas
                'nis' => null,      // Guru tidak memiliki NIS
                'gender' => 'L',
                'is_active' => true,
                'is_alumni' => false,
            ],
            [
                'name' => 'Zara',
                'email' => 'zara@smkn5.com',
                'nis_nip' => 'NIP006',
                'password' => Hash::make('password'),
                'role' => 'guru',
                'jurusan_id' => 6, // Contoh: Ketua Jurusan Kriya Tekstil
                'kelas_id' => null, // Guru tidak terikat pada satu kelas
                'nis' => null,      // Guru tidak memiliki NIS
                'gender' => 'P',
                'is_active' => true,
                'is_alumni' => false,
            ],
            [
                'name' => 'anisa',
                'email' => 'anisa.santoso@smkn5.com',
                'nis_nip' => 'NIP007',
                'password' => Hash::make('password'),
                'role' => 'guru',
                'jurusan_id' => 7, // Guru Kriya Keramik
                'kelas_id' => null, 
                'nis' => null,    
                'gender' => 'P',
                'is_active' => true,
                'is_alumni' => false,
            ],
            [
                'name' => 'Ahmad Fauzi',
                'email' => 'ahmad.fauzi@smkn5.com',
                'nis_nip' => 'NIP008',
                'password' => Hash::make('password'),
                'role' => 'guru',
                'jurusan_id' => 8, // Guru Tata Busana
                'kelas_id' => null,
                'nis' => null,   
                'gender' => 'L',
                'is_active' => true,
                'is_alumni' => false,
            ],
        ];

        foreach ($gurus as $guru) {
            User::create($guru);
        }

        // Ambil semua Kelas yang sudah di-seed
        $kelasCollection = \App\Models\Kelas::all();
        
        $siswaData = [
            // --- Data awal Anda (Saya lengkapi penomorannya dari NIS001 sampai NIS017) ---
            ['name' => 'Andi Pratama', 'email' => 'andi.pratama@student.smkn5.com', 'nis_nip' => 'NIS001', 'jurusan_id' => 1, 'tingkat' => '10', 'gender' => 'L'],
            ['name' => 'Dewi Sari', 'email' => 'dewi.sari@student.smkn5.com', 'nis_nip' => 'NIS002', 'jurusan_id' => 1, 'tingkat' => '11', 'gender' => 'P'],
            ['name' => 'Bambang Sudiro', 'email' => 'bambang.sudiro@student.smkn5.com', 'nis_nip' => 'NIS003', 'jurusan_id' => 1, 'tingkat' => '12', 'gender' => 'L'],

            ['name' => 'Rizky Ramadhan', 'email' => 'rizky.ramadhan@student.smkn5.com', 'nis_nip' => 'NIS004', 'jurusan_id' => 2, 'tingkat' => '12', 'gender' => 'L'],
            ['name' => 'Maya Sari', 'email' => 'maya.sari@student.smkn5.com', 'nis_nip' => 'NIS005', 'jurusan_id' => 2, 'tingkat' => '10', 'gender' => 'P'],
            ['name' => 'Cahyo Utomo', 'email' => 'cahyo.utomo@student.smkn5.com', 'nis_nip' => 'NIS006', 'jurusan_id' => 2, 'tingkat' => '11', 'gender' => 'L'],
            
            ['name' => 'Joko Susilo', 'email' => 'joko.susilo@student.smkn5.com', 'nis_nip' => 'NIS007', 'jurusan_id' => 3, 'tingkat' => '11', 'gender' => 'L'],
            ['name' => 'Rina Wati', 'email' => 'rina.wati@student.smkn5.com', 'nis_nip' => 'NIS008', 'jurusan_id' => 3, 'tingkat' => '12', 'gender' => 'P'],
            ['name' => 'Dian Kusuma', 'email' => 'dian.kusuma@student.smkn5.com', 'nis_nip' => 'NIS009', 'jurusan_id' => 3, 'tingkat' => '10', 'gender' => 'P'],
            
            ['name' => 'Tomi Hartono', 'email' => 'tomi.hartono@student.smkn5.com', 'nis_nip' => 'NIS010', 'jurusan_id' => 4, 'tingkat' => '12', 'gender' => 'L'],
            ['name' => 'Lina Wijaya', 'email' => 'lina.wijaya@student.smkn5.com', 'nis_nip' => 'NIS011', 'jurusan_id' => 4, 'tingkat' => '11', 'gender' => 'P'],

            ['name' => 'Slamet Riyadi', 'email' => 'slamet.riyadi@student.smkn5.com', 'nis_nip' => 'NIS012', 'jurusan_id' => 5, 'tingkat' => '10', 'gender' => 'L'],

            ['name' => 'Nisa Farida', 'email' => 'nisa.farida@student.smkn5.com', 'nis_nip' => 'NIS013', 'jurusan_id' => 6, 'tingkat' => '11', 'gender' => 'P'],
            
            ['name' => 'Fajar Abadi', 'email' => 'fajar.abadi@student.smkn5.com', 'nis_nip' => 'NIS014', 'jurusan_id' => 7, 'tingkat' => '12', 'gender' => 'L'],
            
            ['name' => 'Gita Kirana', 'email' => 'gita.kirana@student.smkn5.com', 'nis_nip' => 'NIS015', 'jurusan_id' => 8, 'tingkat' => '10', 'gender' => 'P'],
            
            ['name' => 'Budi Wijaya', 'email' => 'budi.wijaya@student.smkn5.com', 'nis_nip' => 'NIS016', 'jurusan_id' => 1, 'tingkat' => '10', 'gender' => 'L'],
            ['name' => 'Sari Indah', 'email' => 'sari.indah@student.smkn5.com', 'nis_nip' => 'NIS017', 'jurusan_id' => 2, 'tingkat' => '11', 'gender' => 'P'],
            
            // --- Siswa Tambahan untuk memenuhi minimal 2 siswa per kelas ---
            // Saya akan menggunakan Faker/data dummy untuk mengisi kebutuhan hingga 114 siswa
        ];

        // Generator untuk NIS berikutnya
        $nisCounter = 18; // Mulai dari NIS018

        $jurusans = Jurusan::all();
        $tingkatKelas = ['X', 'XI', 'XII'];
        $romanNumerals = ['I', 'II', 'III'];

        // Loop melalui setiap kelas yang telah Anda buat dan tambahkan siswa
        foreach ($jurusans as $jurusan) {
            foreach ($tingkatKelas as $tingkat) {
                // Ambil semua Kelas untuk Jurusan dan Tingkat saat ini
                $kelasDiTingkat = $kelasCollection
                    ->where('jurusan_id', $jurusan->id)
                    ->where('tingkat', $tingkat);

                // Pastikan setiap kelas memiliki minimal 2 siswa.
                foreach ($kelasDiTingkat as $kelas) {
                    $siswaPerKelas = 2; // Target minimal
                    
                    for ($i = 0; $i < $siswaPerKelas; $i++) {
                        $nis = 'NIS' . str_pad($nisCounter++, 3, '0', STR_PAD_LEFT);
                        $gender = ($i % 2 == 0) ? 'L' : 'P';
                        
                        // Simple name generation without Faker to avoid dependency issues
                        $firstNames = $gender == 'L' ? 
                            ['Ahmad', 'Budi', 'Doni', 'Eko', 'Fajar', 'Gilang', 'Hadi', 'Indra', 'Joko', 'Kurnia'] :
                            ['Ani', 'Bella', 'Citra', 'Dewi', 'Eka', 'Fitri', 'Gita', 'Hani', 'Indah', 'Jihan'];
                        $lastNames = ['Pratama', 'Sari', 'Wijaya', 'Utomo', 'Santoso', 'Kusuma', 'Riyadi', 'Farida', 'Hartono', 'Kirana'];
                        
                        $firstName = $firstNames[array_rand($firstNames)];
                        $lastName = $lastNames[array_rand($lastNames)];
                        $nama = $firstName . ' ' . $lastName;
                        $email = strtolower(str_replace(' ', '.', $nama)) . $nisCounter . '@student.smkn5.com';

                        $siswaData[] = [
                            'name' => $nama,
                            'email' => $email,
                            'nis_nip' => $nis,
                            'jurusan_id' => $jurusan->id,
                            'tingkat' => $tingkat,
                            'gender' => $gender,
                            'kelas_id' => $kelas->id, // Tambahkan kelas_id di sini
                        ];
                    }
                }
            }
        }
        
        // --- PROSES PEMBUATAN USER SISWA ---
        
        // Asumsikan data awal yang Anda berikan belum memiliki 'kelas_id'.
        // Kita harus mengaitkan siswa awal Anda ke kelas yang benar secara manual (atau acak).
        
        // Kita akan mengelompokkan siswaData yang sudah ada berdasarkan jurusan dan tingkatnya
        $siswaByGroup = collect($siswaData)->groupBy(function ($item) {
            return $item['jurusan_id'] . '-' . $item['tingkat'];
        });

        $finalSiswaData = [];

        foreach ($siswaByGroup as $key => $siswaGroup) {
            list($jurusanId, $tingkat) = explode('-', $key);
            
            // Ambil semua Kelas yang sesuai dengan Jurusan dan Tingkat ini
            $availableClasses = $kelasCollection
                ->where('jurusan_id', (int)$jurusanId)
                ->where('tingkat', $tingkat)
                ->pluck('id')
                ->toArray();
                
            if (empty($availableClasses)) continue; // Skip jika tidak ada kelas ditemukan

            $classIndex = 0;
            $classCount = count($availableClasses);
            
            // Distribusikan siswa ke kelas secara merata (round-robin)
            foreach ($siswaGroup as $siswa) {
                $siswa['kelas_id'] = $availableClasses[$classIndex % $classCount];
                $finalSiswaData[] = $siswa;
                $classIndex++;
            }
        }

        // Simpan semua Siswa ke database
        foreach ($finalSiswaData as $siswa) {
            // Randomly make some siswa inactive (30% chance)
            $isActive = rand(1, 100) <= 70; // 70% active, 30% inactive
            
            // Inactive students should not have email and password
            $email = $isActive ? $siswa['email'] : null;
            $password = $isActive ? Hash::make('password') : null;
            
            User::create([
                'name' => $siswa['name'],
                'email' => $email,
                'nis_nip' => $siswa['nis_nip'],
                'nis' => $siswa['nis_nip'], // Use nis_nip as nis for students
                'password' => $password,
                'role' => 'siswa',
                'jurusan_id' => $siswa['jurusan_id'],
                'kelas_id' => $siswa['kelas_id'], // Tambahkan kolom kelas_id
                'gender' => $siswa['gender'] ?? 'L',
                'is_active' => $isActive,
                'is_alumni' => false,
            ]);
        }

    }
}