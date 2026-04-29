<?php

namespace Database\Seeders;

use App\Models\Kelas;
use App\Models\Jurusan;
use Illuminate\Database\Seeder;

class KelasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jurusans = Jurusan::all();
        
        $technologyDepartments = ['RPL', 'TKJT', 'DKV'];
        
        foreach ($jurusans as $jurusan) {
            // Determine number of classes based on department type
            $isTeknologi = in_array($jurusan->singkatan, $technologyDepartments);
            $classCount = $isTeknologi ? 3 : 2;
            
            // Create classes for each grade level (10, 11, 12)
            foreach (['X', 'XI', 'XII'] as $tingkat) {
                $romanNumerals = ['I', 'II', 'III'];
                
                for ($i = 0; $i < $classCount; $i++) {
                    Kelas::create([
                        'jurusan_id' => $jurusan->id,
                        'nama_kelas' => $tingkat . ' ' . $jurusan->singkatan . ' ' . $romanNumerals[$i],
                        'tingkat' => $tingkat,
                    ]);
                }
            }
        }
    }
}
