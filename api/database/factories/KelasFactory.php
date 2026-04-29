<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Kelas>
 */
class KelasFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tingkat = $this->faker->randomElement(['10', '11', '12']);
        $kelas = $this->faker->randomElement(['A', 'B', 'C']);
        
        return [
            'jurusan_id' => 1, // Default to first jurusan
            'nama_kelas' => $tingkat . ' ' . $kelas,
            'tingkat' => $tingkat,
        ];
    }
}
