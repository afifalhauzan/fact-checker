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
        Schema::create('penilaians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proyek_id')->unique()->constrained()->onDelete('cascade'); // 1-to-1 relationship with proyeks
            $table->foreignId('guru_id')->constrained('users')->onDelete('cascade'); // Relation to users (guru)
            $table->integer('nilai_bintang')->unsigned()->default(1); // 1-5 stars (validation will be handled in model/controller)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penilaians');
    }
};
