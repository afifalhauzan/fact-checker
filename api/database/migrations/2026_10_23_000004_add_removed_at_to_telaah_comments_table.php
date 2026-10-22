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
        Schema::table('telaah_comments', function (Blueprint $table) {
            // A deleted comment that still has replies stays as a "Komentar telah dihapus" placeholder;
            // its text and author are wiped when this is set.
            $table->timestamp('removed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('telaah_comments', function (Blueprint $table) {
            $table->dropColumn('removed_at');
        });
    }
};
