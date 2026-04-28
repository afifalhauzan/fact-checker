<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use App\Models\User;
use App\Models\Jurusan;

class PasswordCheckTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test jurusan for relationships
        Jurusan::create([
            'nama' => 'Teknik Informatika',
            'singkatan' => 'TI',
            'kepala_jurusan' => 'Test Kepala Jurusan'
        ]);
    }

    /**
     * Test password status check for unauthenticated user
     */
    public function test_password_check_requires_authentication()
    {
        $response = $this->getJson('/api/auth/password-check');

        $response->assertStatus(401)
                 ->assertJson([
                     'message' => 'Unauthenticated.'
                 ]);
    }

    /**
     * Test password status check for non-guru user
     */
    public function test_password_check_for_non_guru_user()
    {
        $siswa = User::factory()->create([
            'role' => 'siswa',
            'is_changed_password' => false
        ]);

        $response = $this->actingAs($siswa, 'sanctum')
                        ->getJson('/api/auth/password-check');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'needs_password_change' => false,
                         'message' => 'Password check not required for this role'
                     ]
                 ]);
    }

    /**
     * Test password status check for guru with unchanged password
     */
    public function test_password_check_for_guru_with_unchanged_password()
    {
        $guru = User::factory()->create([
            'role' => 'guru',
            'is_changed_password' => false
        ]);

        $response = $this->actingAs($guru, 'sanctum')
                        ->getJson('/api/auth/password-check');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'needs_password_change' => true,
                         'user_id' => $guru->id,
                         'role' => 'guru',
                         'is_changed_password' => false,
                         'message' => 'Password change required for security'
                     ]
                 ]);
    }

    /**
     * Test password status check for guru with already changed password
     */
    public function test_password_check_for_guru_with_changed_password()
    {
        $guru = User::factory()->create([
            'role' => 'guru',
            'is_changed_password' => true
        ]);

        $response = $this->actingAs($guru, 'sanctum')
                        ->getJson('/api/auth/password-check');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'needs_password_change' => false,
                         'user_id' => $guru->id,
                         'role' => 'guru',
                         'is_changed_password' => true,
                         'message' => 'Password status is current'
                     ]
                 ]);
    }

    /**
     * Test password change requires authentication
     */
    public function test_change_password_requires_authentication()
    {
        $response = $this->postJson('/api/auth/change-password', [
            'current_password' => 'password',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123'
        ]);

        $response->assertStatus(401)
                 ->assertJson([
                     'message' => 'Unauthenticated.'
                 ]);
    }

    /**
     * Test password change with invalid validation
     */
    public function test_change_password_with_invalid_validation()
    {
        $guru = User::factory()->create([
            'role' => 'guru',
            'password' => Hash::make('password'),
            'is_changed_password' => false
        ]);

        $response = $this->actingAs($guru, 'sanctum')
                        ->postJson('/api/auth/change-password', [
                            'current_password' => '',
                            'new_password' => '123', // Too short
                            'new_password_confirmation' => '456' // Doesn't match
                        ]);

        $response->assertStatus(422)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Validation failed'
                 ])
                 ->assertJsonStructure([
                     'errors' => [
                         'current_password',
                         'new_password'
                     ]
                 ]);
    }

    /**
     * Test password change with incorrect current password
     */
    public function test_change_password_with_incorrect_current_password()
    {
        $guru = User::factory()->create([
            'role' => 'guru',
            'password' => Hash::make('password'),
            'is_changed_password' => false
        ]);

        $response = $this->actingAs($guru, 'sanctum')
                        ->postJson('/api/auth/change-password', [
                            'current_password' => 'wrongpassword',
                            'new_password' => 'newpassword123',
                            'new_password_confirmation' => 'newpassword123'
                        ]);

        $response->assertStatus(422)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Current password is incorrect'
                 ]);
    }

    /**
     * Test successful password change
     */
    public function test_successful_password_change()
    {
        $guru = User::factory()->create([
            'role' => 'guru',
            'password' => Hash::make('password'),
            'is_changed_password' => false
        ]);

        $response = $this->actingAs($guru, 'sanctum')
                        ->postJson('/api/auth/change-password', [
                            'current_password' => 'password',
                            'new_password' => 'newpassword123',
                            'new_password_confirmation' => 'newpassword123'
                        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Password changed successfully',
                     'data' => [
                         'is_changed_password' => true
                     ]
                 ]);

        // Verify password was actually changed in database
        $guru->refresh();
        $this->assertEquals(1, $guru->is_changed_password); // SQLite stores boolean as 1/0
        $this->assertTrue(Hash::check('newpassword123', $guru->password));
    }

    /**
     * Test password change marks user as having changed password
     */
    public function test_password_change_updates_flag()
    {
        $guru = User::factory()->create([
            'role' => 'guru',
            'password' => Hash::make('password'),
            'is_changed_password' => false
        ]);

        // Verify user needs password change initially
        $this->assertTrue($guru->needsPasswordChange());

        // Change password
        $this->actingAs($guru, 'sanctum')
             ->postJson('/api/auth/change-password', [
                 'current_password' => 'password',
                 'new_password' => 'newpassword123',
                 'new_password_confirmation' => 'newpassword123'
             ]);

        // Verify user no longer needs password change
        $guru->refresh();
        $this->assertFalse($guru->needsPasswordChange());
    }

    /**
     * Test get password requirements endpoint
     */
    public function test_get_password_requirements()
    {
        $response = $this->getJson('/api/auth/password-requirements');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'requirements' => [
                             'min_length' => 8
                         ]
                     ]
                 ])
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'requirements' => [
                             'min_length',
                             'must_contain'
                         ],
                         'security_tips',
                         'default_info'
                     ]
                 ]);
    }

    /**
     * Test User model needsPasswordChange method for guru
     */
    public function test_user_needs_password_change_method_for_guru()
    {
        $guruNeedsChange = User::factory()->create([
            'role' => 'guru',
            'is_changed_password' => false
        ]);

        $guruNoChange = User::factory()->create([
            'role' => 'guru',
            'is_changed_password' => true
        ]);

        $this->assertTrue($guruNeedsChange->needsPasswordChange());
        $this->assertFalse($guruNoChange->needsPasswordChange());
    }

    /**
     * Test User model needsPasswordChange method for non-guru
     */
    public function test_user_needs_password_change_method_for_non_guru()
    {
        $siswa = User::factory()->create([
            'role' => 'siswa',
            'is_changed_password' => false
        ]);

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_changed_password' => false
        ]);

        $this->assertFalse($siswa->needsPasswordChange());
        $this->assertFalse($admin->needsPasswordChange());
    }

    /**
     * Test User model markPasswordAsChanged method
     */
    public function test_user_mark_password_as_changed_method()
    {
        $guru = User::factory()->create([
            'role' => 'guru',
            'is_changed_password' => false
        ]);

        $this->assertTrue($guru->needsPasswordChange());

        $guru->markPasswordAsChanged();
        $guru->refresh();

        $this->assertFalse($guru->needsPasswordChange());
        $this->assertEquals(1, $guru->is_changed_password); // SQLite stores boolean as 1/0
    }

    /**
     * Test imported guru has correct password change flag
     */
    public function test_imported_guru_password_flag()
    {
        // Simulate imported guru (as would be created by GuruImport)
        $importedGuru = User::create([
            'name' => 'Imported Teacher',
            'email' => 'imported.teacher@smkn5solo.sch.id',
            'password' => Hash::make('password'),
            'nis_nip' => '123456789012345',
            'role' => 'guru',
            'is_changed_password' => false, // This is the key flag
            'is_active' => true,
            'email_verified_at' => now()
        ]);

        $this->assertTrue($importedGuru->needsPasswordChange());
        $this->assertFalse($importedGuru->is_changed_password);
    }

    /**
     * Test manually created guru has correct password change flag
     */
    public function test_manually_created_guru_password_flag()
    {
        // Simulate manually created guru (as would be created by AkunController)
        $manualGuru = User::create([
            'name' => 'Manual Teacher',
            'email' => 'manual.teacher@smkn5solo.sch.id',
            'password' => Hash::make('custompassword123'),
            'nis_nip' => '987654321098765',
            'role' => 'guru',
            'is_changed_password' => true, // This should be true for manual accounts
            'is_active' => true
        ]);

        $this->assertFalse($manualGuru->needsPasswordChange());
        $this->assertTrue($manualGuru->is_changed_password);
    }
}
