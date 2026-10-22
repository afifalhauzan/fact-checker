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
            $table->unsignedInteger('like_count')->default(0);
            $table->unsignedInteger('spam_count')->default(0);
            // Set only when a personal-data report is confirmed by the redaction scan
            $table->timestamp('hidden_at')->nullable();
        });

        Schema::create('telaah_comment_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained('telaah_comments')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['comment_id', 'user_id']);
        });

        Schema::create('telaah_comment_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained('telaah_comments')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16);
            $table->timestamps();

            $table->unique(['comment_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telaah_comment_reports');
        Schema::dropIfExists('telaah_comment_likes');
        Schema::table('telaah_comments', function (Blueprint $table) {
            $table->dropColumn(['like_count', 'spam_count', 'hidden_at']);
        });
    }
};
