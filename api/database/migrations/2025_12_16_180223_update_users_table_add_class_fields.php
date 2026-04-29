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
        Schema::table('users', function (Blueprint $table) {
            // Make email and password nullable
            $table->string('email')->nullable()->change();
            $table->string('password')->nullable()->change();
            
            // Add new fields
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->string('nis')->unique()->nullable(); // NIS for students, null for teachers/admin
            $table->enum('gender', ['L', 'P'])->nullable(); // L = Laki-laki, P = Perempuan
            $table->boolean('is_active')->default(false);
            $table->boolean('is_alumni')->default(false);
            
            // Remove the old kelas string field if it exists
            $table->dropColumn('kelas');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Reverse the changes
            $table->string('email')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
            
            $table->dropForeign(['kelas_id']);
            $table->dropColumn(['kelas_id', 'nis', 'gender', 'is_active', 'is_alumni']);
            
            // Add back the old kelas string field
            $table->string('kelas')->nullable();
        });
    }
};
