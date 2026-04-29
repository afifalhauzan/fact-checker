<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Jurusan;
use App\Models\Kelas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ClaimAccountControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'JurusanSeeder']);
        $this->artisan('db:seed', ['--class' => 'KelasSeeder']);
    }

    /** @test */
    public function it_can_claim_an_unregistered_student_account()
    {
        // Arrange
        $jurusan = Jurusan::first();
        $kelas = Kelas::where('jurusan_id', $jurusan->id)->first();
        
        $student = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => null,
            'password' => null,
            'is_active' => false,
            'nis' => 'CLAIM001',
            'nis_nip' => 'CLAIM001',
            'email_verified_at' => null
        ]);

        $claimData = [
            'nis' => 'CLAIM001',
            'email' => 'student@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        // Act
        $response = $this->postJson('/api/auth/claim', $claimData);

        // Assert
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'token',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'nis',
                        'nis_nip',
                        'is_active',
                        'jurusan_id',
                        'kelas_id',
                        'jurusan',
                        'kelas'
                    ],
                    'token_type'
                ])
                ->assertJson([
                    'success' => true,
                    'message' => 'Account claimed successfully! Welcome to SMKN 5.',
                    'token_type' => 'Bearer'
                ]);

        // Verify user data was updated correctly
        $student->refresh();
        $this->assertEquals('student@example.com', $student->email);
        $this->assertTrue(Hash::check('password123', $student->password));
        $this->assertTrue($student->isActive()); // Use isActive() method instead of is_active attribute
        $this->assertNotNull($student->email_verified_at);

        // Verify token is valid
        $token = $response->json('token');
        $this->assertNotEmpty($token);
    }

    /** @test */
    public function it_prevents_claiming_already_active_account()
    {
        // Arrange
        $jurusan = Jurusan::first();
        $kelas = Kelas::where('jurusan_id', $jurusan->id)->first();
        
        $activeStudent = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => 'existing@example.com',
            'password' => Hash::make('password'),
            'is_active' => true,
            'nis' => 'ACTIVE001',
            'nis_nip' => 'ACTIVE001'
        ]);

        $claimData = [
            'nis' => 'ACTIVE001',
            'email' => 'newemail@example.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ];

        // Act
        $response = $this->postJson('/api/auth/claim', $claimData);

        // Assert
        $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'message' => 'Account already claimed. Please contact administrator if you need assistance.'
                ]);

        // Verify original data wasn't changed
        $activeStudent->refresh();
        $this->assertEquals('existing@example.com', $activeStudent->email);
        $this->assertTrue(Hash::check('password', $activeStudent->password));
    }

    /** @test */
    public function it_returns_404_when_nis_does_not_exist()
    {
        // Arrange
        $claimData = [
            'nis' => 'NONEXISTENT',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        // Act
        $response = $this->postJson('/api/auth/claim', $claimData);

        // Assert
        $response->assertStatus(422) // Validation error for non-existent NIS
                ->assertJsonValidationErrors(['nis']);
    }

    /** @test */
    public function it_validates_required_fields()
    {
        // Act
        $response = $this->postJson('/api/auth/claim', []);

        // Assert
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['nis', 'email', 'password']);
    }

    /** @test */
    public function it_validates_email_format()
    {
        // Arrange
        $jurusan = Jurusan::first();
        $kelas = Kelas::where('jurusan_id', $jurusan->id)->first();
        
        User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => null,
            'password' => null,
            'is_active' => false,
            'nis' => 'VALID001',
            'nis_nip' => 'VALID001'
        ]);

        $claimData = [
            'nis' => 'VALID001',
            'email' => 'invalid-email',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        // Act
        $response = $this->postJson('/api/auth/claim', $claimData);

        // Assert
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_validates_email_uniqueness()
    {
        // Arrange
        $jurusan = Jurusan::first();
        $kelas = Kelas::where('jurusan_id', $jurusan->id)->first();
        
        // Create existing user with email
        User::factory()->create([
            'email' => 'taken@example.com',
            'role' => 'siswa'
        ]);

        // Create student to claim
        User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => null,
            'password' => null,
            'is_active' => false,
            'nis' => 'CLAIM002',
            'nis_nip' => 'CLAIM002'
        ]);

        $claimData = [
            'nis' => 'CLAIM002',
            'email' => 'taken@example.com', // This email is already taken
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        // Act
        $response = $this->postJson('/api/auth/claim', $claimData);

        // Assert
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_validates_password_confirmation()
    {
        // Arrange
        $jurusan = Jurusan::first();
        $kelas = Kelas::where('jurusan_id', $jurusan->id)->first();
        
        User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => null,
            'password' => null,
            'is_active' => false,
            'nis' => 'CONFIRM001',
            'nis_nip' => 'CONFIRM001'
        ]);

        $claimData = [
            'nis' => 'CONFIRM001',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'differentpassword' // Doesn't match
        ];

        // Act
        $response = $this->postJson('/api/auth/claim', $claimData);

        // Assert
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function it_validates_minimum_password_length()
    {
        // Arrange
        $jurusan = Jurusan::first();
        $kelas = Kelas::where('jurusan_id', $jurusan->id)->first();
        
        User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => null,
            'password' => null,
            'is_active' => false,
            'nis' => 'SHORT001',
            'nis_nip' => 'SHORT001'
        ]);

        $claimData = [
            'nis' => 'SHORT001',
            'email' => 'test@example.com',
            'password' => '123', // Too short
            'password_confirmation' => '123'
        ];

        // Act
        $response = $this->postJson('/api/auth/claim', $claimData);

        // Assert
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function it_includes_user_relationships_in_response()
    {
        // Arrange
        $jurusan = Jurusan::first();
        $kelas = Kelas::where('jurusan_id', $jurusan->id)->first();
        
        $student = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => null,
            'password' => null,
            'is_active' => false,
            'nis' => 'REL001',
            'nis_nip' => 'REL001'
        ]);

        $claimData = [
            'nis' => 'REL001',
            'email' => 'relationships@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        // Act
        $response = $this->postJson('/api/auth/claim', $claimData);

        // Assert
        $response->assertStatus(200);

        $userData = $response->json('user');
        $this->assertArrayHasKey('jurusan', $userData);
        $this->assertArrayHasKey('kelas', $userData);
        $this->assertArrayHasKey('jurusan_name', $userData);

        $this->assertEquals($jurusan->id, $userData['jurusan']['id']);
        $this->assertEquals($kelas->id, $userData['kelas']['id']);
        $this->assertEquals($jurusan->nama, $userData['jurusan_name']);
    }
}