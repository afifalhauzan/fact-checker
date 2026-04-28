<?php

namespace Database\Factories;

use App\Models\Jurusan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Jurusan>
 */
class JurusanFactory extends Factory
{
    protected $model = Jurusan::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $jurusans = [
            ['nama' => 'Teknik Komputer dan Jaringan', 'singkatan' => 'TKJ'],
            ['nama' => 'Rekayasa Perangkat Lunak', 'singkatan' => 'RPL'],
            ['nama' => 'Multimedia', 'singkatan' => 'MM'],
            ['nama' => 'Akuntansi dan Keuangan Lembaga', 'singkatan' => 'AKL'],
            ['nama' => 'Bisnis Daring dan Pemasaran', 'singkatan' => 'BDP'],
        ];

        $jurusan = $this->faker->randomElement($jurusans);

        return [
            'nama' => $jurusan['nama'],
            'singkatan' => $jurusan['singkatan'],
        ];
    }

    /**
     * Create TKJ jurusan state
     */
    public function tkj(): static
    {
        return $this->state(fn (array $attributes) => [
            'nama' => 'Teknik Komputer dan Jaringan',
            'singkatan' => 'TKJ',
        ]);
    }

    /**
     * Create RPL jurusan state
     */
    public function rpl(): static
    {
        return $this->state(fn (array $attributes) => [
            'nama' => 'Rekayasa Perangkat Lunak',
            'singkatan' => 'RPL',
        ]);
    }
}
