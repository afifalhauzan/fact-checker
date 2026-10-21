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
        Schema::table('telaah_posts', function (Blueprint $table) {
            // Hash of the signed analysis a post was published from: one analysis, one post.
            // Seed posts have none.
            $table->char('share_key', 64)->nullable()->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('telaah_posts', function (Blueprint $table) {
            $table->dropUnique(['share_key']);
            $table->dropColumn('share_key');
        });
    }
};
