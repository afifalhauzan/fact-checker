<?php

namespace Database\Seeders;

use App\Models\Penilaian;
use App\Models\Proyek;
use App\Models\User;
use Illuminate\Database\Seeder;

class PenilaianSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $proyeksDinilai = Proyek::get();
        $gurus = User::where('role', 'guru')->get();

        // Create penilaian for projects that have been assessed
        foreach ($proyeksDinilai as $proyek) {
            // Find guru from same department as the project
            $validGuru = $gurus->where('jurusan_id', $proyek->jurusan_id)->first();
            $proyek->update(['status' => 'dinilai']);
            
            if ($validGuru) {
                $rating = rand(3, 5);
                
                $comments = [
                    1 => 'Perlu perbaikan signifikan dalam beberapa aspek.',
                    2 => 'Ada beberapa aspek yang perlu diperbaiki.',
                    3 => 'Karya cukup baik, masih ada ruang untuk improvement.',
                    4 => 'Karya yang bagus dengan eksekusi yang baik.',
                    5 => 'Karya yang sangat baik dan menunjukkan pemahaman yang mendalam.'
                ];
                
                Penilaian::create([
                    'proyek_id' => $proyek->id,
                    'guru_id' => $validGuru->id,
                    'bintang' => $rating,
                    'catatan' => $comments[$rating],
                ]);
            }
        }

        // Add one more penilaian for demonstration with specific ratings
        $proyekTerkirim = Proyek::where('status', 'terkirim')->first();
        if ($proyekTerkirim && $gurus->count() > 0) {
            // Find guru from same department
            $validGuru = $gurus->where('jurusan_id', $proyekTerkirim->jurusan_id)->first();
            
            if ($validGuru) {
                // Change status to dinilai first
                $proyekTerkirim->update(['status' => 'dinilai']);
                
                Penilaian::create([
                    'proyek_id' => $proyekTerkirim->id,
                    'guru_id' => $validGuru->id,
                    'bintang' => 4,
                    'catatan' => 'Proyek menunjukkan pemahaman yang baik tentang konsep yang diajarkan. Implementasi sudah sesuai dengan requirement.',
                ]);
            }
        }
    }
}
