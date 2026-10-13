<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_use_the_token(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'token_type', 'user' => ['id', 'name', 'email']])
            ->assertJsonMissingPath('user.password');

        $this->withToken($response->json('token'))
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'rahasia-123',
            'password_confirmation' => 'rahasia-123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.name', 'Budi Santoso')
            ->assertJsonStructure(['token', 'token_type']);

        $this->withToken($response->json('token'))
            ->getJson('/api/auth/me')
            ->assertJsonPath('user.email', 'budi@example.com');
    }

    public function test_register_rejects_a_taken_email(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/register', [
            'name' => 'Someone Else',
            'email' => $user->email,
            'password' => 'rahasia-123',
            'password_confirmation' => 'rahasia-123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
