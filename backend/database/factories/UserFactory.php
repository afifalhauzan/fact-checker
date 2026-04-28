<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker ? $this->faker->name() : 'Test User',
            'email' => $this->faker ? $this->faker->unique()->safeEmail() : 'test' . time() . '@example.com',
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => $this->faker ? $this->faker->randomElement(['siswa', 'guru']) : 'siswa',
            'nis_nip' => $this->faker ? $this->faker->unique()->numerify('##########') : '1234567890',
            'jurusan_id' => 1, // Default jurusan
            'kelas_id' => null, // Will be set for students
            'nis' => function (array $attributes) {
                return $attributes['role'] === 'siswa' ? $this->faker->unique()->numerify('##########') : null;
            },
            'gender' => $this->faker ? $this->faker->randomElement(['L', 'P']) : 'L',
            'is_active' => true, // Active by default (with email)
            'is_alumni' => false,
            'is_changed_password' => true, // Default to true for factory-created users
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Create an unregistered user (for import scenarios).
     */
    public function unregistered(): static
    {
        return $this->state(fn (array $attributes) => [
            'email' => null,
            'password' => null,
            'email_verified_at' => null,
            'remember_token' => null,
            'is_active' => false,
        ]);
    }

    /**
     * Create a student user.
     */
    public function student(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'siswa',
            'nis' => $this->faker->unique()->numerify('##########'),
        ]);
    }

    /**
     * Create a teacher user.
     */
    public function teacher(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'guru',
            'nis' => null,
        ]);
    }

    /**
     * Create an admin user.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
            'nis' => null,
        ]);
    }
}
