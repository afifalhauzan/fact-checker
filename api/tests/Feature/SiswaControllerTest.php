<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Jurusan;
use App\Models\Kelas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class SiswaControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test data instead of relying on seeders
        $this->createTestData();
    }

    private function createTestData()
    {
        // Create jurusans
        $this->jurusan1 = Jurusan::create([
            'nama' => 'Rekayasa Perangkat Lunak',
            'singkatan' => 'RPL',
            'kode_jurusan' => 'RPL',
            'deskripsi' => 'Jurusan RPL'
        ]);

        $this->jurusan2 = Jurusan::create([
            'nama' => 'Teknik Komputer Jaringan',
            'singkatan' => 'TKJ',
            'kode_jurusan' => 'TKJ', 
            'deskripsi' => 'Jurusan TKJ'
        ]);

        // Create kelas
        $this->kelas1 = Kelas::create([
            'nama_kelas' => 'X RPL 1',
            'tingkat' => 'X',
            'jurusan_id' => $this->jurusan1->id
        ]);

        $this->kelas2 = Kelas::create([
            'nama_kelas' => 'XI TKJ 1', 
            'tingkat' => 'XI',
            'jurusan_id' => $this->jurusan2->id
        ]);
    }

    /** @test */
    public function it_can_get_all_jurusans()
    {
        // Act
        $response = $this->getJson('/api/jurusans');

        // Assert
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'nama',
                            'singkatan'
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true
                ]);

        $this->assertTrue(count($response->json('data')) > 0);
    }

    /** @test */
    public function it_can_get_kelas_by_jurusan()
    {
        // Act
        $response = $this->getJson("/api/kelas/by-jurusan?jurusan_id={$this->jurusan1->id}");

        // Assert
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'nama_kelas',
                            'tingkat'
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true
                ]);
        
        $data = $response->json('data');
        $this->assertGreaterThan(0, count($data));
    }

    /** @test */
    public function it_returns_error_when_jurusan_id_is_missing_for_kelas()
    {
        // Act
        $response = $this->getJson('/api/kelas/by-jurusan');

        // Assert
        $response->assertStatus(400)
                ->assertJson([
                    'success' => false,
                    'message' => 'Jurusan ID is required'
                ]);
    }

    /** @test */
    public function it_can_get_available_students()
    {
        // Arrange
        $jurusan = Jurusan::first();
        $kelas = Kelas::where('jurusan_id', $jurusan->id)->first();
        
        // Create unregistered students (no email, inactive)
        $student1 = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => null,
            'password' => null,
            'is_active' => false,
            'nis' => 'TEST001',
            'nis_nip' => 'TEST001'
        ]);

        $student2 = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => null,
            'password' => null,
            'is_active' => false,
            'nis' => 'TEST002',
            'nis_nip' => 'TEST002'
        ]);

        // Create an active student (should not appear in results)
        User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $jurusan->id,
            'kelas_id' => $kelas->id,
            'email' => 'active@test.com',
            'is_active' => true,
            'nis' => 'TEST003',
            'nis_nip' => 'TEST003'
        ]);

        // Act
        $response = $this->getJson("/api/siswa/available?kelas_id={$kelas->id}");

        // Assert
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'nis'
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true
                ]);

        $data = $response->json('data');
        $this->assertCount(2, $data); // Only unregistered students should appear

        $nisNumbers = array_column($data, 'nis');
        $this->assertContains('TEST001', $nisNumbers);
        $this->assertContains('TEST002', $nisNumbers);
        $this->assertNotContains('TEST003', $nisNumbers); // Active student should not appear
    }

    /** @test */
    public function it_returns_validation_error_when_kelas_id_is_missing_for_available_students()
    {
        // Act
        $response = $this->getJson('/api/siswa/available');

        // Assert
        $response->assertStatus(500) // Validation exception will be caught and return 500
                ->assertJson([
                    'success' => false
                ]);
    }

    /** @test */
    public function it_returns_validation_error_when_kelas_id_does_not_exist()
    {
        // Act
        $response = $this->getJson('/api/siswa/available?kelas_id=99999');

        // Assert
        $response->assertStatus(500) // Validation exception will be caught and return 500
                ->assertJson([
                    'success' => false
                ]);
    }

    /** @test */
    public function it_returns_empty_array_when_no_available_students_in_kelas()
    {
        // Arrange
        $jurusan = Jurusan::first();
        $kelas = Kelas::where('jurusan_id', $jurusan->id)->first();

        // Act
        $response = $this->getJson("/api/siswa/available?kelas_id={$kelas->id}");

        // Assert
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => []
                ]);
    }

    /** @test */
    public function it_can_get_all_kelas()
    {
        // Act
        $response = $this->getJson('/api/kelas');

        // Assert
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'nama_kelas',
                            'tingkat',
                            'jurusan_id',
                            'jurusan' => [
                                'id',
                                'nama'
                            ]
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true
                ]);
    }
}