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
        Schema::table('messages', function (Blueprint $table) {
            // The user's rating of an assistant answer, collected for evaluating TelaahKarier
            $table->string('feedback', 8)->nullable();
            $table->string('feedback_reason', 500)->nullable();
            $table->timestamp('feedback_at')->nullable();

            $table->index('feedback');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['feedback']);
            $table->dropColumn(['feedback', 'feedback_reason', 'feedback_at']);
        });
    }
};
