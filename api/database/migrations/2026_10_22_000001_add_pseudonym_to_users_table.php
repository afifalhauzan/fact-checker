<?php

use App\Models\User;
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
            // Public name in TelaahBareng, e.g. "Pencari Kerja #a3f9"; the account name is never shown
            $table->string('pseudonym', 40)->nullable()->unique();
        });

        User::whereNull('pseudonym')->each(function (User $user) {
            $user->forceFill(['pseudonym' => User::newPseudonym()])->save();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['pseudonym']);
            $table->dropColumn('pseudonym');
        });
    }
};
