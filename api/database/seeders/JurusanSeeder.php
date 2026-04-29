<?php

namespace Database\Seeders;

use App\Models\Jurusan;
use Illuminate\Database\Seeder;

class JurusanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jurusans = [
            ['nama' => 'Rekayasa Perangkat Lunak', 'singkatan' => 'RPL'],       // ID 1
            ['nama' => 'Teknik Komputer Jaringan dan Telekomunikasi', 'singkatan' => 'TKJT'], // ID 2
            ['nama' => 'Desain Komunikasi Visual', 'singkatan' => 'DKV'],       // ID 3
            ['nama' => 'Animasi', 'singkatan' => 'ANIM'],                    // ID 4
            ['nama' => 'Kriya Kreatif Kayu & Rotan', 'singkatan' => 'KKA'],                      // ID 5
            ['nama' => 'Kriya Kreatif Batik & Tekstil', 'singkatan' => 'KTK'],                   // ID 6
            ['nama' => 'Kriya Kreatif Keramik', 'singkatan' => 'KKR'],                  // ID 7
            ['nama' => 'Desain dan Produksi Busana', 'singkatan' => 'DPB'],                     // ID 8
        ];

        foreach ($jurusans as $jurusan) {
            Jurusan::create($jurusan);
        }
    }
}