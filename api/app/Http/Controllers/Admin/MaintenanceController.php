<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use App\Models\Proyek;
use App\Models\Penilaian;
use App\Models\HeroImage;
use App\Models\Kelas;
use Illuminate\Support\Facades\Log;

class MaintenanceController extends Controller
{
    /**
     * Nuclear Button 1: Reset Projects Only
     * 
     * Case: New semester/project cycle - keep students and teachers
     * Clears: Proyeks & Penilaian
     * Keeps: Users, Jurusan, Kelas, HeroImages
     */
    public function resetProjectsOnly(Request $request): JsonResponse
    {
        // Check if user is admin
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya admin yang dapat menggunakan fungsi maintenance.'
            ], 403);
        }

        try {
            Log::info('🔥 Nuclear Button 1: Reset Projects Only initiated', [
                'admin_id' => $request->user()->id,
                'admin_name' => $request->user()->name,
                'timestamp' => now()
            ]);

            DB::transaction(function () {
                // Delete assessments first (has FK to proyeks)
                $penilaianCount = Penilaian::count();
                Penilaian::query()->delete();
                
                // Delete projects
                $proyekCount = Proyek::count();
                Proyek::query()->delete();
                
                Log::info('📊 Projects reset completed', [
                    'penilaian_deleted' => $penilaianCount,
                    'proyek_deleted' => $proyekCount
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Seluruh karya dan penilaian telah dibersihkan. Siswa dan guru tetap tersimpan.',
                'reset_level' => 1,
                'items_cleared' => ['proyeks', 'penilaian']
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Reset Projects Only failed', [
                'error' => $e->getMessage(),
                'admin_id' => $request->user()->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mereset proyek: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Nuclear Button 2: Reset Academic Year
     * 
     * Case: New academic year - keep school structure
     * Clears: Users (except admin), Proyeks, Penilaian, HeroImages
     * Keeps: Jurusan, Kelas structure
     */
    public function resetAcademicYear(Request $request): JsonResponse
    {
        // Check if user is admin
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya admin yang dapat menggunakan fungsi maintenance.'
            ], 403);
        }

        try {
            Log::info('🔥🔥 Nuclear Button 2: Reset Academic Year initiated', [
                'admin_id' => $request->user()->id,
                'admin_name' => $request->user()->name,
                'timestamp' => now()
            ]);

            DB::transaction(function () {
                // Disable foreign key checks for safe deletion
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');

                // Count items before deletion
                $penilaianCount = Penilaian::count();
                $proyekCount = Proyek::count();
                $siswaCount = User::where('role', 'siswa')->count();
                $guruCount = User::where('role', 'guru')->count();
                $heroImageCount = HeroImage::count();

                // Delete in correct order (respect FK constraints)
                Penilaian::truncate();
                Proyek::truncate();
                HeroImage::truncate();
                
                // Delete users except admins
                User::whereIn('role', ['siswa', 'guru'])->delete();

                // Re-enable foreign key checks
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');

                Log::info('📊 Academic year reset completed', [
                    'penilaian_deleted' => $penilaianCount,
                    'proyek_deleted' => $proyekCount,
                    'siswa_deleted' => $siswaCount,
                    'guru_deleted' => $guruCount,
                    'hero_images_deleted' => $heroImageCount
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Sistem direset untuk tahun ajaran baru. Struktur jurusan dan kelas tetap tersimpan.',
                'reset_level' => 2,
                'items_cleared' => ['users (siswa, guru)', 'proyeks', 'penilaian', 'hero_images']
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Reset Academic Year failed', [
                'error' => $e->getMessage(),
                'admin_id' => $request->user()->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mereset tahun ajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Nuclear Button 3: Total System Reset
     * 
     * Case: Major system restructure or fresh installation
     * Clears: EVERYTHING except Jurusan (department structure)
     * Keeps: Only Jurusan data
     */
    public function totalSystemReset(Request $request): JsonResponse
    {
        // Check if user is admin
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya admin yang dapat menggunakan fungsi maintenance.'
            ], 403);
        }

        try {
            Log::info('🔥🔥🔥 Nuclear Button 3: TOTAL SYSTEM RESET initiated', [
                'admin_id' => $request->user()->id,
                'admin_name' => $request->user()->name,
                'timestamp' => now()
            ]);

            DB::transaction(function () {
                // Disable foreign key checks for safe deletion
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');

                // Count items before deletion
                $penilaianCount = Penilaian::count();
                $proyekCount = Proyek::count();
                $userCount = User::count();
                $kelasCount = Kelas::count();
                $heroImageCount = HeroImage::count();

                // Nuclear deletion - clear everything except Jurusan
                Penilaian::truncate();
                Proyek::truncate();
                HeroImage::truncate();
                User::truncate(); // This will delete ALL users including admins
                Kelas::truncate();

                // Recreate default admin user immediately after total reset
                User::create([
                    'name' => 'Admin SMKN 5',
                    'email' => 'admin@smkn5.com',
                    'nis_nip' => 'ADM001',
                    'password' => Hash::make('password'),
                    'role' => 'admin',
                    'jurusan_id' => null,
                    'kelas_id' => null,
                    'nis' => null,
                    'gender' => 'L',
                    'is_active' => true,
                    'is_alumni' => false,
                    'is_changed_password' => true, // Admin doesn't need to change password
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Re-enable foreign key checks
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');

                Log::info('📊 Total system reset completed', [
                    'penilaian_deleted' => $penilaianCount,
                    'proyek_deleted' => $proyekCount,
                    'users_deleted' => $userCount,
                    'kelas_deleted' => $kelasCount,
                    'hero_images_deleted' => $heroImageCount,
                    'admin_recreated' => 'admin@smkn5.com'
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'TOTAL RESET BERHASIL! Sistem kembali ke kondisi awal. Admin baru dibuat: admin@smkn5.com (password: password)',
                'reset_level' => 3,
                'items_cleared' => ['ALL USERS (including admins)', 'ALL proyeks', 'ALL penilaian', 'ALL kelas', 'ALL hero_images'],
                'admin_recreated' => [
                    'email' => 'admin@smkn5.com',
                    'password' => 'password'
                ],
                'note' => 'Silakan login kembali dengan akun admin yang baru dibuat'
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Total System Reset failed', [
                'error' => $e->getMessage(),
                'admin_id' => $request->user()->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan total reset: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get system statistics for maintenance dashboard
     */
    public function getSystemStats(Request $request): JsonResponse
    {
        // Check if user is admin
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya admin yang dapat menggunakan fungsi maintenance.'
            ], 403);
        }

        try {
            $stats = [
                'users' => [
                    'total' => User::count(),
                    'admin' => User::where('role', 'admin')->count(),
                    'guru' => User::where('role', 'guru')->count(),
                    'siswa' => User::where('role', 'siswa')->count(),
                    'active' => User::where('is_active', true)->count(),
                    'inactive' => User::where('is_active', false)->count(),
                ],
                'projects' => [
                    'total' => Proyek::count(),
                    'with_images' => Proyek::whereNotNull('image_path')->count(),
                ],
                'assessments' => [
                    'total' => Penilaian::count(),
                ],
                'structure' => [
                    'jurusans' => \App\Models\Jurusan::count(),
                    'kelas' => Kelas::count(),
                ],
                'media' => [
                    'hero_images' => HeroImage::count(),
                ]
            ];

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'generated_at' => now()
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Get system stats failed', [
                'error' => $e->getMessage(),
                'admin_id' => $request->user()->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik sistem: ' . $e->getMessage()
            ], 500);
        }
    }
}