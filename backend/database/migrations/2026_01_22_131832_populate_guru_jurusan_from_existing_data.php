<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all gurus with jurusan_id and insert into pivot table
        $gurus = DB::table('users')
            ->where('role', 'guru')
            ->whereNotNull('jurusan_id')
            ->select('id as user_id', 'jurusan_id')
            ->get();

        foreach ($gurus as $guru) {
            // Insert if not exists (Laravel way, works with all databases)
            DB::table('guru_jurusan')->insertOrIgnore([
                'user_id' => $guru->user_id,
                'jurusan_id' => $guru->jurusan_id,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Clear the guru_jurusan table
        DB::table('guru_jurusan')->truncate();
    }
};
