<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('proyeks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Relation to users (siswa)
            $table->foreignId('jurusan_id')->constrained()->onDelete('cascade'); // Duplication of siswa's jurusan for easier filtering
            $table->string('judul');
            $table->text('deskripsi');
            $table->string('tautan_proyek'); // External URL
            $table->enum('status', ['terkirim', 'dinilai'])->default('terkirim');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proyeks');
    }
};
