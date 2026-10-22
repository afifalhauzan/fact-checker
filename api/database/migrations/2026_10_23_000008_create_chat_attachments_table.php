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
        Schema::create('chat_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            // The user message it was sent with, by the client id the messages table also keeps
            $table->string('message_client_id', 100);
            $table->string('path');
            $table->string('filename')->nullable();
            $table->string('mime', 60);
            $table->unsignedInteger('size');
            $table->char('sha256', 64);
            $table->timestamps();

            // A message saved again (e.g. when its answer is regenerated) reuses its files
            $table->unique(['conversation_id', 'message_client_id', 'sha256']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_attachments');
    }
};
