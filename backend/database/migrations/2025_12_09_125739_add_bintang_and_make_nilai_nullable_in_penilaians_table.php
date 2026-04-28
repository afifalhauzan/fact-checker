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
            $table->integer('bintang')->unsigned()->nullable()->after('nilai'); // Star rating 1-5
            $table->integer('nilai')->unsigned()->nullable()->change(); // Make nilai nullable
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('penilaians', function (Blueprint $table) {
            $table->dropColumn('bintang');
            $table->integer('nilai')->unsigned()->default(0)->change(); // Revert nilai back to non-nullable
        });
    }
};
