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
        Schema::table('penilaians', function (Blueprint $table) {
            $table->dropColumn('nilai_bintang');
            $table->integer('nilai')->after('guru_id');
            $table->text('catatan')->nullable()->after('nilai');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('penilaians', function (Blueprint $table) {
            $table->dropColumn(['nilai', 'catatan']);
            $table->integer('nilai_bintang')->after('guru_id');
        });
    }
};
