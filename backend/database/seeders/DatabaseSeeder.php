<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Run seeders in correct order due to foreign key constraints
        $this->call([
            JurusanSeeder::class,
            KelasSeeder::class,
            UserSeeder::class,
            ProyekSeeder::class,
            PenilaianSeeder::class,
        ]);
    }
}
