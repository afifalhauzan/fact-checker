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
        Schema::create('telaah_posts', function (Blueprint $table) {
            $table->id();
            // Kept when the account is deleted: the post stays, shown under its pseudonym
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('author_pseudonym', 40);
            $table->string('status', 24)->default('visible');

            $table->string('title', 120);
            $table->text('story')->nullable();
            $table->string('risk_level', 10);
            $table->text('claim');
            $table->text('summary');
            $table->string('modus', 24);
            $table->json('evidence');
            $table->json('material_lines');
            $table->json('links');
            $table->json('contacts');

            $table->string('company')->nullable();
            $table->string('position')->nullable();
            $table->string('location')->nullable();
            $table->string('salary')->nullable();
            $table->date('open_date')->nullable();
            $table->date('close_date')->nullable();
            $table->string('source_platform', 40)->nullable();
            $table->string('source_account')->nullable();

            $table->unsignedInteger('reaction_count')->default(0);
            $table->unsignedInteger('comment_count')->default(0);
            $table->unsignedInteger('match_count')->default(0);
            $table->unsignedInteger('spam_count')->default(0);
            $table->boolean('is_seed')->default(false);
            $table->timestamp('analyzed_at');
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });

        Schema::create('telaah_identifiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('telaah_posts')->cascadeOnDelete();
            $table->string('kind', 10);
            // Normalized by the web app, e.g. phones as 628..., so different spellings match
            $table->string('value');

            $table->index(['kind', 'value']);
        });

        Schema::create('telaah_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('telaah_posts')->cascadeOnDelete();
            $table->string('path');
            $table->string('label');
            $table->string('mime', 40);
            $table->unsignedInteger('size');
            // Of the file that was analyzed, before EXIF was removed
            $table->char('sha256', 64);
            $table->timestamps();
        });

        Schema::create('telaah_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('telaah_posts')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('author_pseudonym', 40);
            $table->text('body');
            $table->string('flag', 24)->nullable();
            $table->timestamps();

            $table->index(['post_id', 'created_at']);
        });

        Schema::create('telaah_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('telaah_posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['post_id', 'user_id']);
        });

        Schema::create('telaah_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('telaah_posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16);
            $table->timestamps();

            $table->unique(['post_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telaah_reports');
        Schema::dropIfExists('telaah_reactions');
        Schema::dropIfExists('telaah_comments');
        Schema::dropIfExists('telaah_attachments');
        Schema::dropIfExists('telaah_identifiers');
        Schema::dropIfExists('telaah_posts');
    }
};
