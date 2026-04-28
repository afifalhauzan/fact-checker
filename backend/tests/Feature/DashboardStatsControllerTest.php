<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\Proyek;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DashboardStatsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test data
        $this->createTestData();
    }

    private function createTestData()
    {
        // Create jurusans
        $this->jurusanRPL = Jurusan::create(['nama' => 'RPL', 'singkatan' => 'RPL']);
        $this->jurusanTKJ = Jurusan::create(['nama' => 'TKJ', 'singkatan' => 'TKJ']);
        
        // Create kelas
        $this->kelasRPL1 = Kelas::create([
            'jurusan_id' => $this->jurusanRPL->id,
            'nama_kelas' => 'XII RPL 1',
            'tingkat' => 12
        ]);
        
        $this->kelasRPL2 = Kelas::create([
            'jurusan_id' => $this->jurusanRPL->id,
            'nama_kelas' => 'XII RPL 2',
            'tingkat' => 12
        ]);
        
        $this->kelasTKJ1 = Kelas::create([
            'jurusan_id' => $this->jurusanTKJ->id,
            'nama_kelas' => 'XII TKJ 1',
            'tingkat' => 12
        ]);
        
        // Create admin user
        $this->admin = User::factory()->create([
            'role' => 'admin',
            'jurusan_id' => null,
            'kelas_id' => null,
            'is_active' => true
        ]);
        
        // Create guru users
        $this->guruRPL = User::factory()->create([
            'role' => 'guru',
            'jurusan_id' => $this->jurusanRPL->id,
            'kelas_id' => null,
            'is_active' => true
        ]);
        
        $this->guruTKJ = User::factory()->create([
            'role' => 'guru',
            'jurusan_id' => $this->jurusanTKJ->id,
            'kelas_id' => null,
            'is_active' => true
        ]);
        
        // Create siswa users
        $this->siswaRPL1_1 = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $this->jurusanRPL->id,
            'kelas_id' => $this->kelasRPL1->id,
            'is_active' => true,
            'nis' => 'RPL001'
        ]);
        
        $this->siswaRPL1_2 = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $this->jurusanRPL->id,
            'kelas_id' => $this->kelasRPL1->id,
            'is_active' => true,
            'nis' => 'RPL002'
        ]);
        
        $this->siswaRPL2_1 = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $this->jurusanRPL->id,
            'kelas_id' => $this->kelasRPL2->id,
            'is_active' => true,
            'nis' => 'RPL003'
        ]);
        
        $this->siswaTKJ1_1 = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $this->jurusanTKJ->id,
            'kelas_id' => $this->kelasTKJ1->id,
            'is_active' => true,
            'nis' => 'TKJ001'
        ]);
        
        // Create some proyeks (submissions)
        Proyek::create([
            'user_id' => $this->siswaRPL1_1->id,
            'jurusan_id' => $this->jurusanRPL->id,
            'judul' => 'Project RPL 1',
            'deskripsi' => 'Test project',
            'tautan_proyek' => 'https://example.com/project1',
            'status' => 'terkirim'
        ]);
        
        Proyek::create([
            'user_id' => $this->siswaTKJ1_1->id,
            'jurusan_id' => $this->jurusanTKJ->id,
            'judul' => 'Project TKJ 1',
            'deskripsi' => 'Test project',
            'tautan_proyek' => 'https://example.com/project2',
            'status' => 'terkirim'
        ]);
    }

    /** @test */
    public function admin_can_access_dashboard_stats()
    {
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'jurusan_nama',
                            'jurusan_singkatan',
                            'total_siswa',
                            'total_submitted',
                            'total_pending',
                            'percentage_submitted',
                            'kelas' => [
                                '*' => [
                                    'nama_kelas',
                                    'tingkat',
                                    'total_siswa',
                                    'submitted_count',
                                    'pending_count',
                                    'percentage_submitted',
                                    'students_submitted',
                                    'students_pending'
                                ]
                            ]
                        ]
                    ],
                    'summary',
                    'user_role'
                ])
                ->assertJson([
                    'success' => true,
                    'user_role' => 'admin'
                ]);
    }

    /** @test */
    public function guru_can_access_stats_for_own_jurusan_only()
    {
        $response = $this->actingAs($this->guruRPL)
                         ->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'user_role' => 'guru'
                ]);
        
        $data = $response->json('data');
        $this->assertCount(1, $data); // Should only see RPL jurusan
        $this->assertEquals('RPL', $data[0]['jurusan_nama']);
    }

    /** @test */
    public function siswa_cannot_access_dashboard_stats()
    {
        $response = $this->actingAs($this->siswaRPL1_1)
                         ->getJson('/api/dashboard/stats');

        $response->assertStatus(403);
    }

    /** @test */
    public function admin_can_access_specific_jurusan_stats()
    {
        $response = $this->actingAs($this->admin)
                         ->getJson("/api/dashboard/stats/jurusan/{$this->jurusanRPL->id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'jurusan_nama',
                        'jurusan_singkatan',
                        'total_siswa',
                        'total_submitted',
                        'total_pending',
                        'kelas_details'
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'jurusan_nama' => 'RPL'
                    ]
                ]);
    }

    /** @test */
    public function guru_cannot_access_other_jurusan_stats()
    {
        $response = $this->actingAs($this->guruRPL)
                         ->getJson("/api/dashboard/stats/jurusan/{$this->jurusanTKJ->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function guru_can_access_own_jurusan_stats()
    {
        $response = $this->actingAs($this->guruRPL)
                         ->getJson("/api/dashboard/stats/jurusan/{$this->jurusanRPL->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'jurusan_nama' => 'RPL'
                    ]
                ]);
    }

    /** @test */
    public function stats_correctly_count_submitted_and_pending_students()
    {
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/dashboard/stats');

        $response->assertStatus(200);
        
        $data = $response->json('data');
        $rplData = collect($data)->firstWhere('jurusan_nama', 'RPL');
        $tkjData = collect($data)->firstWhere('jurusan_nama', 'TKJ');
        
        // RPL should have 3 total students, 1 submitted, 2 pending
        $this->assertEquals(3, $rplData['total_siswa']);
        $this->assertEquals(1, $rplData['total_submitted']);
        $this->assertEquals(2, $rplData['total_pending']);
        
        // TKJ should have 1 total student, 1 submitted, 0 pending
        $this->assertEquals(1, $tkjData['total_siswa']);
        $this->assertEquals(1, $tkjData['total_submitted']);
        $this->assertEquals(0, $tkjData['total_pending']);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_stats()
    {
        $response = $this->getJson('/api/dashboard/stats');

        $response->assertStatus(401);
    }

    /** @test */
    public function admin_can_access_detailed_project_information_in_stats()
    {
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/dashboard/stats');

        $response->assertStatus(200);
        
        $data = $response->json('data');
        $rplData = collect($data)->firstWhere('jurusan_nama', 'RPL');
        
        // Check that kelas data includes project details for submitted students
        $kelas = $rplData['kelas'][0]; // First kelas (XII RPL 1)
        $submittedStudents = $kelas['students_submitted'];
        
        $this->assertCount(1, $submittedStudents); // Should have 1 submitted student
        
        $student = $submittedStudents[0];
        $this->assertArrayHasKey('projects', $student);
        $this->assertArrayHasKey('total_karya', $student);
        $this->assertEquals(1, $student['total_karya']);
        
        // Check project structure
        $this->assertCount(1, $student['projects']);
        $project = $student['projects'][0];
        $this->assertArrayHasKey('id', $project);
        $this->assertArrayHasKey('judul', $project);
        $this->assertArrayHasKey('date', $project);
        $this->assertArrayHasKey('status', $project);
        $this->assertEquals('Project RPL 1', $project['judul']);
        $this->assertEquals('terkirim', $project['status']);
    }

    /** @test */
    public function stats_count_both_terkirim_and_dinilai_status_projects()
    {
        // Create a project with dinilai status  
        Proyek::create([
            'user_id' => $this->siswaRPL1_2->id,
            'jurusan_id' => $this->jurusanRPL->id,
            'judul' => 'Graded Project',
            'deskripsi' => 'Test graded project',
            'tautan_proyek' => 'https://example.com/graded',
            'status' => 'dinilai' // Should be counted as submitted
        ]);

        $response = $this->actingAs($this->admin)
                         ->getJson('/api/dashboard/stats');

        $response->assertStatus(200);
        
        $data = $response->json('data');
        $rplData = collect($data)->firstWhere('jurusan_nama', 'RPL');
        
        // Should now have 2 submitted (both 'terkirim' and 'dinilai' projects count)
        $this->assertEquals(2, $rplData['total_submitted']);
        $this->assertEquals(1, $rplData['total_pending']); // Only siswaRPL2_1 should be pending
    }
}