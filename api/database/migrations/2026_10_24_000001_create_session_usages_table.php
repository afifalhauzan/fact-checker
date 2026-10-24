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
        // One row per TelaahLoker session that reached the model. Kept apart from conversations so
        // that deleting a session does not give its daily slot back.
        Schema::create('session_usages', function (Blueprint $table) {
            $table->id();
            // Null for a guest's session
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            // The conversation may not exist yet (it is created when the first answer is saved)
            $table->uuid('conversation_id')->unique();
            $table->unsignedInteger('tokens_used')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_usages');
    }
};
