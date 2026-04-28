<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\HeroImage;
use App\Models\Jurusan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HeroCarouselTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $guruUser;
    protected $siswaUser;
    protected $jurusan;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test jurusan
        $this->jurusan = Jurusan::factory()->create([
            'nama' => 'Teknik Informatika',
            'singkatan' => 'TI'
        ]);

        // Create test users
        $this->adminUser = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@test.com'
        ]);

        $this->guruUser = User::factory()->create([
            'role' => 'guru',
            'jurusan_id' => $this->jurusan->id,
            'email' => 'guru@test.com'
        ]);

        $this->siswaUser = User::factory()->create([
            'role' => 'siswa',
            'jurusan_id' => $this->jurusan->id,
            'email' => 'siswa@test.com'
        ]);

        // Fake storage for file uploads
        Storage::fake('public');
    }

    /** @test */
    public function it_can_get_carousel_slides_without_authentication()
    {
        // Create test hero images
        HeroImage::factory()->create([
            'title' => 'Active Slide',
            'subtitle' => 'This slide is active',
            'image_url' => '/test-image-1.jpg',
            'is_active' => true,
            'sort_order' => 1
        ]);

        HeroImage::factory()->create([
            'title' => 'Inactive Slide',
            'subtitle' => 'This slide is inactive',
            'image_url' => '/test-image-2.jpg',
            'is_active' => false,
            'sort_order' => 2
        ]);

        $response = $this->getJson('/api/carousel-slides');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ])
            ->assertJsonCount(1, 'data'); // Only active slide should be returned

        $this->assertEquals('Active Slide', $response->json('data.0.title'));
    }

    /** @test */
    public function admin_can_get_all_hero_images()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        HeroImage::factory()->count(3)->create();

        $response = $this->getJson('/api/hero-images');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ])
            ->assertJsonCount(3, 'data');
    }

    /** @test */
    public function admin_can_create_hero_image_with_file_upload()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        $file = UploadedFile::fake()->image('hero.jpg', 800, 600)->size(1000);

        $response = $this->postJson('/api/hero-images', [
            'title' => 'Test Hero Image',
            'subtitle' => 'Test subtitle for hero image',
            'image' => $file,
            'is_active' => true,
            'sort_order' => 5
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Hero image created successfully'
            ]);

        // Verify database record
        $this->assertDatabaseHas('hero_images', [
            'title' => 'Test Hero Image',
            'subtitle' => 'Test subtitle for hero image',
            'is_active' => true,
            'sort_order' => 5
        ]);

        // Verify file was stored
        $heroImage = HeroImage::first();
        $this->assertStringContainsString('/storage/hero-images/', $heroImage->image_url);
        
        $imagePath = str_replace('/storage/', '', $heroImage->image_url);
        Storage::disk('public')->assertExists($imagePath);
    }

    /** @test */
    public function admin_can_show_specific_hero_image()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        $heroImage = HeroImage::factory()->create([
            'title' => 'Specific Hero Image'
        ]);

        $response = $this->getJson("/api/hero-images/{$heroImage->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $heroImage->id,
                    'title' => 'Specific Hero Image'
                ]
            ]);
    }

    /** @test */
    public function admin_can_update_hero_image()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        $heroImage = HeroImage::factory()->create([
            'title' => 'Original Title',
            'subtitle' => 'Original Subtitle'
        ]);

        $response = $this->putJson("/api/hero-images/{$heroImage->id}", [
            'title' => 'Updated Title',
            'subtitle' => 'Updated Subtitle',
            'is_active' => false
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Hero image updated successfully'
            ]);

        $heroImage->refresh();
        $this->assertEquals('Updated Title', $heroImage->title);
        $this->assertEquals('Updated Subtitle', $heroImage->subtitle);
        $this->assertFalse($heroImage->is_active);
    }

    /** @test */
    public function admin_can_update_hero_image_with_new_file()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        // Create initial hero image with old file
        $oldFile = UploadedFile::fake()->image('old.jpg');
        $heroImage = HeroImage::factory()->create([
            'image_url' => '/storage/hero-images/old_image.jpg'
        ]);

        // Store old file to simulate existing file
        Storage::disk('public')->put('hero-images/old_image.jpg', 'fake content');

        $newFile = UploadedFile::fake()->image('new.jpg', 800, 600);

        $response = $this->putJson("/api/hero-images/{$heroImage->id}", [
            'title' => 'Updated with new image',
            'image' => $newFile
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Hero image updated successfully'
            ]);

        $heroImage->refresh();
        
        // New image should be stored
        $newImagePath = str_replace('/storage/', '', $heroImage->image_url);
        Storage::disk('public')->assertExists($newImagePath);
        
        // Old image should be deleted
        Storage::disk('public')->assertMissing('hero-images/old_image.jpg');
    }

    /** @test */
    public function admin_can_delete_hero_image()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        $heroImage = HeroImage::factory()->create([
            'image_url' => '/storage/hero-images/test_image.jpg'
        ]);

        // Store file to simulate existing file
        Storage::disk('public')->put('hero-images/test_image.jpg', 'fake content');

        $response = $this->deleteJson("/api/hero-images/{$heroImage->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Hero image deleted successfully'
            ]);

        // Record should be deleted from database
        $this->assertDatabaseMissing('hero_images', [
            'id' => $heroImage->id
        ]);

        // File should be deleted from storage
        Storage::disk('public')->assertMissing('hero-images/test_image.jpg');
    }

    /** @test */
    public function non_admin_users_cannot_access_crud_operations()
    {
        // Test with guru user
        $this->actingAs($this->guruUser, 'sanctum');

        $response = $this->getJson('/api/hero-images');
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ]);

        // Test with siswa user
        $this->actingAs($this->siswaUser, 'sanctum');

        $response = $this->postJson('/api/hero-images', [
            'title' => 'Test',
            'subtitle' => 'Test'
        ]);
        $response->assertStatus(403);
    }

    /** @test */
    public function unauthenticated_users_cannot_access_crud_operations()
    {
        $response = $this->getJson('/api/hero-images');
        $response->assertStatus(401);

        $response = $this->postJson('/api/hero-images', [
            'title' => 'Test',
            'subtitle' => 'Test'
        ]);
        $response->assertStatus(401);
    }

    /** @test */
    public function it_validates_required_fields_when_creating()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        $response = $this->postJson('/api/hero-images', []);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed'
            ])
            ->assertJsonValidationErrors(['title', 'subtitle', 'image']);
    }

    /** @test */
    public function it_validates_image_file_type_and_size()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        // Test invalid file type
        $invalidFile = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->postJson('/api/hero-images', [
            'title' => 'Test Title',
            'subtitle' => 'Test Subtitle',
            'image' => $invalidFile
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);

        // Test oversized file (3MB when max is 2MB)
        $oversizedFile = UploadedFile::fake()->image('large.jpg')->size(3000);

        $response = $this->postJson('/api/hero-images', [
            'title' => 'Test Title',
            'subtitle' => 'Test Subtitle',
            'image' => $oversizedFile
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    /** @test */
    public function it_validates_string_length_limits()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        $file = UploadedFile::fake()->image('test.jpg');

        $response = $this->postJson('/api/hero-images', [
            'title' => str_repeat('A', 256), // Over 255 character limit
            'subtitle' => str_repeat('B', 1001), // Over 1000 character limit
            'image' => $file
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'subtitle']);
    }

    /** @test */
    public function it_handles_file_upload_errors_gracefully()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        // Mock storage failure
        Storage::shouldReceive('disk->put')->andReturn(false);

        $file = UploadedFile::fake()->image('test.jpg');

        $response = $this->postJson('/api/hero-images', [
            'title' => 'Test Title',
            'subtitle' => 'Test Subtitle',
            'image' => $file
        ]);

        // Should handle the error gracefully
        $response->assertStatus(500);
    }

    /** @test */
    public function it_orders_carousel_slides_properly()
    {
        // Create slides with different sort orders
        HeroImage::factory()->create([
            'title' => 'Third Slide',
            'is_active' => true,
            'sort_order' => 3
        ]);

        HeroImage::factory()->create([
            'title' => 'First Slide',
            'is_active' => true,
            'sort_order' => 1
        ]);

        HeroImage::factory()->create([
            'title' => 'Second Slide',
            'is_active' => true,
            'sort_order' => 2
        ]);

        $response = $this->getJson('/api/carousel-slides');

        $response->assertStatus(200);
        
        $slides = $response->json('data');
        
        $this->assertEquals('First Slide', $slides[0]['title']);
        $this->assertEquals('Second Slide', $slides[1]['title']);
        $this->assertEquals('Third Slide', $slides[2]['title']);
    }

    /** @test */
    public function it_returns_404_for_non_existent_hero_image()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        $response = $this->getJson('/api/hero-images/999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Hero image not found'
            ]);
    }

    /** @test */
    public function it_can_filter_hero_images_by_active_status()
    {
        $this->actingAs($this->adminUser, 'sanctum');

        HeroImage::factory()->create(['is_active' => true]);
        HeroImage::factory()->create(['is_active' => false]);
        HeroImage::factory()->create(['is_active' => true]);

        // Get only active images
        $response = $this->getJson('/api/hero-images?active=true');
        
        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // Get only inactive images  
        $response = $this->getJson('/api/hero-images?active=false');
        
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}