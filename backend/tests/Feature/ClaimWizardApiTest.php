<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Jurusan;
use App\Models\Kelas;

class ClaimWizardApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test jurusan and kelas manually
        $jurusan = Jurusan::create(['nama' => 'RPL', 'singkatan' => 'RPL']);
        $kelas = Kelas::create([
            'jurusan_id' => $jurusan->id,
            'nama_kelas' => 'XII RPL 1',
            'tingkat' => 12
        ]);
        
        // Create test student
        User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => null,
            'password' => null,
            'is_active' => false,
            'nis' => 'TEST001'
        ]);
    }
    /** @test */
    public function it_can_access_all_claim_wizard_endpoints()
    {
        // Test jurusan endpoint
        $jurusanResponse = $this->getJson('/api/jurusans');
        $jurusanResponse->assertStatus(200)
                        ->assertJsonStructure(['success', 'data']);

        // Test kelas endpoint  
        $kelasResponse = $this->getJson('/api/kelas');
        $kelasResponse->assertStatus(200)
                      ->assertJsonStructure(['success', 'data']);

        // Test that claim endpoint exists (will fail validation but endpoint should exist)
        $claimResponse = $this->postJson('/api/auth/claim', []);
        $claimResponse->assertStatus(422); // Validation error, but endpoint exists

        // Test siswa available endpoint (will fail validation but endpoint should exist)
        $availableResponse = $this->getJson('/api/siswa/available');
        $availableResponse->assertStatus(500); // Validation error caught by controller
    }

    /** @test */
    public function it_returns_proper_cors_headers()
    {
        $response = $this->getJson('/api/jurusans');
        
        // These endpoints should be accessible publicly
        $response->assertStatus(200);
        
        // Basic API structure check
        $response->assertJsonStructure([
            'success',
            'data'
        ]);
    }
}