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
        Schema::table('proyeks', function (Blueprint $table) {
            // Make tautan_proyek nullable to support dynamic media types
            $table->string('tautan_proyek')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proyeks', function (Blueprint $table) {
            // Revert tautan_proyek to NOT NULL (commented out to prevent data loss)
            // $table->string('tautan_proyek')->nullable(false)->change();
        });
    }
};
