<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Proyek>
 */
class ProyekFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'jurusan_id' => \App\Models\Jurusan::factory(),
            'judul' => fake()->sentence(3),
            'deskripsi' => fake()->paragraphs(2, true),
            'tautan_proyek' => fake()->url(),
            'image_url' => fake()->imageUrl(640, 480, 'technology'),
            'status' => fake()->randomElement(['terkirim', 'dinilai']),
            'is_published' => fake()->boolean(30), // 30% chance of being published
        ];
    }
}
