<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Proyek;
use App\Models\Jurusan;
use App\Models\Kelas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjekControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test jurusans and kelas
        $this->jurusan1 = Jurusan::factory()->create(['nama' => 'Rekayasa Perangkat Lunak']);
        $this->jurusan2 = Jurusan::factory()->create(['nama' => 'Teknik Komputer Jaringan']);
        
        $this->kelas1 = Kelas::factory()->create([
            'jurusan_id' => $this->jurusan1->id,
            'tingkat' => 'XII'
        ]);
        
        $this->kelas2 = Kelas::factory()->create([
            'jurusan_id' => $this->jurusan2->id,
            'tingkat' => 'XII'
        ]);

        // Create test users
        $this->admin = User::factory()->create([
            'role' => 'admin',
            'jurusan_id' => $this->jurusan1->id,
        ]);

        $this->guru1 = User::factory()->create([
            'role' => 'guru',
            'jurusan_id' => $this->jurusan1->id,
        ]);

        $this->guru2 = User::factory()->create([
            'role' => 'guru',
            'jurusan_id' => $this->jurusan2->id,
        ]);

        $this->siswa1 = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $this->jurusan1->id,
            'kelas_id' => $this->kelas1->id,
        ]);

        $this->siswa2 = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $this->jurusan2->id,
            'kelas_id' => $this->kelas2->id,
        ]);

        // Create test projects
        $this->publishedProyek = Proyek::factory()->create([
            'user_id' => $this->siswa1->id,
            'jurusan_id' => $this->jurusan1->id,
            'status' => 'dinilai',
            'is_published' => true,
        ]);

        $this->unpublishedProyek = Proyek::factory()->create([
            'user_id' => $this->siswa1->id,
            'jurusan_id' => $this->jurusan1->id,
            'status' => 'dinilai',
            'is_published' => false,
        ]);

        $this->otherUserProyek = Proyek::factory()->create([
            'user_id' => $this->siswa2->id,
            'jurusan_id' => $this->jurusan2->id,
            'status' => 'dinilai',
            'is_published' => false,
        ]);
    }

    /** @test */
    public function unauthenticated_users_only_see_published_projects()
    {
        $response = $this->getJson('/api/proyeks');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'judul',
                    'deskripsi',
                    'is_published',
                    'status'
                ]
            ]
        ]);

        // Should only return published projects
        $projects = $response->json('data');
        $this->assertCount(1, $projects);
        $this->assertTrue($projects[0]['is_published']);
        $this->assertEquals($this->publishedProyek->id, $projects[0]['id']);
    }

    /** @test */
    public function authenticated_users_can_see_all_projects_based_on_permissions()
    {
        $this->actingAs($this->admin, 'sanctum');

        $response = $this->getJson('/api/proyeks');

        $response->assertStatus(200);
        
        // Admin should see all projects
        $projects = $response->json('data');
        $this->assertGreaterThanOrEqual(3, count($projects));
    }

    /** @test */
    public function project_owner_can_update_publication_status()
    {
        $this->actingAs($this->siswa1, 'sanctum');

        // Publish an unpublished project
        $response = $this->patchJson("/api/proyeks/{$this->unpublishedProyek->id}/publish", [
            'is_published' => true
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Project published successfully',
            'data' => [
                'id' => $this->unpublishedProyek->id,
                'is_published' => true
            ]
        ]);

        $this->assertDatabaseHas('proyeks', [
            'id' => $this->unpublishedProyek->id,
            'is_published' => true
        ]);
    }

    /** @test */
    public function project_owner_can_unpublish_project()
    {
        $this->actingAs($this->siswa1, 'sanctum');

        // Unpublish a published project
        $response = $this->patchJson("/api/proyeks/{$this->publishedProyek->id}/publish", [
            'is_published' => false
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Project unpublished successfully',
            'data' => [
                'id' => $this->publishedProyek->id,
                'is_published' => false
            ]
        ]);

        $this->assertDatabaseHas('proyeks', [
            'id' => $this->publishedProyek->id,
            'is_published' => false
        ]);
    }

    /** @test */
    public function admin_can_update_any_project_publication_status()
    {
        $this->actingAs($this->admin, 'sanctum');

        $response = $this->patchJson("/api/proyeks/{$this->otherUserProyek->id}/publish", [
            'is_published' => true
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Project published successfully'
        ]);

        $this->assertDatabaseHas('proyeks', [
            'id' => $this->otherUserProyek->id,
            'is_published' => true
        ]);
    }

    /** @test */
    public function guru_can_update_projects_from_own_department()
    {
        $this->actingAs($this->guru1, 'sanctum');

        // Should be able to update project from same department
        $response = $this->patchJson("/api/proyeks/{$this->unpublishedProyek->id}/publish", [
            'is_published' => true
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Project published successfully'
        ]);
    }

    /** @test */
    public function guru_cannot_update_projects_from_other_departments()
    {
        $this->actingAs($this->guru1, 'sanctum');

        // Should not be able to update project from different department
        $response = $this->patchJson("/api/proyeks/{$this->otherUserProyek->id}/publish", [
            'is_published' => true
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Unauthorized to update projects from other departments'
        ]);

        // Verify database wasn't changed
        $this->assertDatabaseHas('proyeks', [
            'id' => $this->otherUserProyek->id,
            'is_published' => false
        ]);
    }

    /** @test */
    public function siswa_cannot_update_other_users_projects()
    {
        $this->actingAs($this->siswa1, 'sanctum');

        $response = $this->patchJson("/api/proyeks/{$this->otherUserProyek->id}/publish", [
            'is_published' => true
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Unauthorized to update publication status of this project'
        ]);

        // Verify database wasn't changed
        $this->assertDatabaseHas('proyeks', [
            'id' => $this->otherUserProyek->id,
            'is_published' => false
        ]);
    }

    /** @test */
    public function unauthenticated_users_cannot_update_publication_status()
    {
        $response = $this->patchJson("/api/proyeks/{$this->unpublishedProyek->id}/publish", [
            'is_published' => true
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function it_validates_is_published_field_is_required()
    {
        $this->actingAs($this->siswa1, 'sanctum');

        $response = $this->patchJson("/api/proyeks/{$this->unpublishedProyek->id}/publish", []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['is_published']);
    }

    /** @test */
    public function it_validates_is_published_field_is_boolean()
    {
        $this->actingAs($this->siswa1, 'sanctum');

        $response = $this->patchJson("/api/proyeks/{$this->unpublishedProyek->id}/publish", [
            'is_published' => 'invalid'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['is_published']);
    }

    /** @test */
    public function it_returns_404_for_non_existent_project()
    {
        $this->actingAs($this->admin, 'sanctum');

        $response = $this->patchJson('/api/proyeks/99999/publish', [
            'is_published' => true
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'success' => false,
            'message' => 'Project not found'
        ]);
    }

    /** @test */
    public function published_projects_are_included_in_public_endpoints()
    {
        // Test latest endpoint
        $response = $this->getJson('/api/proyeks/latest');
        $response->assertStatus(200);
        
        $projects = $response->json('data');
        $publishedProjectIds = collect($projects)->pluck('id')->toArray();
        
        // Should include published project
        $this->assertContains($this->publishedProyek->id, $publishedProjectIds);
        
        // Should not include unpublished project
        $this->assertNotContains($this->unpublishedProyek->id, $publishedProjectIds);
    }

    /** @test */
    public function unpublished_projects_are_excluded_from_public_endpoints()
    {
        // Test best endpoint
        $response = $this->getJson('/api/proyeks/best');
        $response->assertStatus(200);
        
        $projects = $response->json('data');
        $projectIds = collect($projects)->pluck('id')->toArray();
        
        // Should not include unpublished projects
        $this->assertNotContains($this->unpublishedProyek->id, $projectIds);
    }

    /** @test */
    public function project_creation_defaults_to_unpublished()
    {
        Storage::fake('public');
        
        $this->actingAs($this->siswa1, 'sanctum');

        $response = $this->postJson('/api/proyeks', [
            'judul' => 'Test Project',
            'deskripsi' => 'Test Description',
            'jurusan_id' => $this->jurusan1->id,
            'tautan_proyek' => 'https://example.com',
            'status' => 'terkirim'
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'data' => [
                'is_published' => false
            ]
        ]);

        $this->assertDatabaseHas('proyeks', [
            'judul' => 'Test Project',
            'is_published' => false
        ]);
    }

    /** @test */
    public function project_can_be_created_as_published_when_explicitly_set()
    {
        Storage::fake('public');
        
        $this->actingAs($this->siswa1, 'sanctum');

        $response = $this->postJson('/api/proyeks', [
            'judul' => 'Published Project',
            'deskripsi' => 'Published Description',
            'jurusan_id' => $this->jurusan1->id,
            'tautan_proyek' => 'https://example.com',
            'status' => 'terkirim',
            'is_published' => true
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'data' => [
                'is_published' => true
            ]
        ]);

        $this->assertDatabaseHas('proyeks', [
            'judul' => 'Published Project',
            'is_published' => true
        ]);
    }

    /** @test */
    public function update_publish_status_returns_complete_project_data()
    {
        $this->actingAs($this->siswa1, 'sanctum');

        $response = $this->patchJson("/api/proyeks/{$this->unpublishedProyek->id}/publish", [
            'is_published' => true
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'judul',
                'deskripsi',
                'is_published',
                'status',
                'user' => [
                    'id',
                    'name'
                ],
                'jurusan' => [
                    'id'
                ]
            ]
        ]);

        // Verify the project data includes relationships
        $projectData = $response->json('data');
        $this->assertArrayHasKey('user', $projectData);
        $this->assertArrayHasKey('jurusan', $projectData);
        $this->assertTrue($projectData['is_published']);
    }
}