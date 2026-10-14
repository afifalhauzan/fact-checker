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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            // Message id assigned by the web client; saving the same message again updates it
            $table->string('client_id', 100);
            $table->string('role', 20);
            $table->longText('content')->nullable();
            $table->json('meta_data')->nullable();
            $table->timestamps();

            $table->unique(['conversation_id', 'client_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
