<?php

/*
 * Tinker Test Commands for Galeri SMKN5 Database
 * 
 * Run in tinker with: php artisan tinker
 * Then execute these commands one by one or copy-paste sections
 */

// ===== BASIC MODEL TESTING =====

// 1. Test Jurusan model
echo "=== Testing Jurusan Model ===\n";
$jurusans = App\Models\Jurusan::all();
echo "Total Jurusans: " . $jurusans->count() . "\n";
foreach ($jurusans as $jurusan) {
    echo "- {$jurusan->nama} ({$jurusan->singkatan})\n";
}

// 2. Test User model with roles
echo "\n=== Testing User Model ===\n";
$admin = App\Models\User::where('role', 'admin')->first();
echo "Admin: {$admin->name} ({$admin->email})\n";

$gurus = App\Models\User::where('role', 'guru')->get();
echo "Total Gurus: " . $gurus->count() . "\n";

$siswa = App\Models\User::where('role', 'siswa')->get();
echo "Total Siswa: " . $siswa->count() . "\n";

// 3. Test Proyek model
echo "\n=== Testing Proyek Model ===\n";
$proyeks = App\Models\Proyek::all();
echo "Total Proyeks: " . $proyeks->count() . "\n";
foreach ($proyeks as $proyek) {
    echo "- {$proyek->judul} by {$proyek->user->name} (Status: {$proyek->status})\n";
}

// 4. Test Penilaian model
echo "\n=== Testing Penilaian Model ===\n";
$penilaians = App\Models\Penilaian::all();
echo "Total Penilaians: " . $penilaians->count() . "\n";
foreach ($penilaians as $penilaian) {
    echo "- {$penilaian->proyek->judul}: {$penilaian->nilai_bintang} stars by {$penilaian->guru->name}\n";
}

// ===== RELATIONSHIP TESTING =====

echo "\n=== Testing Relationships ===\n";

// Test User -> Jurusan relationship
$siswaWithJurusan = App\Models\User::with('jurusan')->where('role', 'siswa')->first();
if ($siswaWithJurusan && $siswaWithJurusan->jurusan) {
    echo "Siswa {$siswaWithJurusan->name} is in {$siswaWithJurusan->jurusan->nama}\n";
}

// Test Jurusan -> Users relationship
$rpl = App\Models\Jurusan::where('singkatan', 'RPL')->first();
if ($rpl) {
    echo "RPL has " . $rpl->siswa->count() . " siswa\n";
    foreach ($rpl->siswa as $siswa) {
        echo "- {$siswa->name}\n";
    }
}

// Test User -> Proyeks relationship
$siswaWithProyeks = App\Models\User::with('proyeks')->where('role', 'siswa')->first();
if ($siswaWithProyeks) {
    echo "\n{$siswaWithProyeks->name} has " . $siswaWithProyeks->proyeks->count() . " proyeks:\n";
    foreach ($siswaWithProyeks->proyeks as $proyek) {
        echo "- {$proyek->judul}\n";
    }
}

// Test Proyek -> Penilaian relationship
$proyekWithPenilaian = App\Models\Proyek::with('penilaian')->where('status', 'dinilai')->first();
if ($proyekWithPenilaian && $proyekWithPenilaian->penilaian) {
    echo "\nProyek '{$proyekWithPenilaian->judul}' rated {$proyekWithPenilaian->penilaian->nilai_bintang} stars\n";
}

// ===== SCOPES TESTING =====

echo "\n=== Testing Model Scopes ===\n";

// Test User scopes
$guruUsers = App\Models\User::guru()->get();
echo "Guru users: " . $guruUsers->count() . "\n";

$siswaUsers = App\Models\User::siswa()->get();
echo "Siswa users: " . $siswaUsers->count() . "\n";

// Test Proyek scopes
$proyekTerkirim = App\Models\Proyek::terkirim()->get();
echo "Proyeks terkirim: " . $proyekTerkirim->count() . "\n";

$proyekDinilai = App\Models\Proyek::dinilai()->get();
echo "Proyeks dinilai: " . $proyekDinilai->count() . "\n";

// Test Penilaian scopes
$highRatings = App\Models\Penilaian::highRating()->get();
echo "High ratings (4-5 stars): " . $highRatings->count() . "\n";

// ===== CRUD OPERATIONS TESTING =====

echo "\n=== Testing CRUD Operations ===\n";

// Create new jurusan
$newJurusan = App\Models\Jurusan::create([
    'nama' => 'Multimedia',
    'singkatan' => 'MM'
]);
echo "Created new jurusan: {$newJurusan->nama}\n";

// Create new user
$newSiswa = App\Models\User::create([
    'name' => 'Test Siswa',
    'email' => 'test.siswa@example.com',
    'nis_nip' => 'TEST001',
    'password' => bcrypt('password'),
    'role' => 'siswa',
    'jurusan_id' => $newJurusan->id
]);
echo "Created new siswa: {$newSiswa->name}\n";

// Create new proyek
$newProyek = App\Models\Proyek::create([
    'user_id' => $newSiswa->id,
    'jurusan_id' => $newJurusan->id,
    'judul' => 'Test Project',
    'deskripsi' => 'This is a test project created via tinker',
    'tautan_proyek' => 'https://github.com/test/test-project',
    'status' => 'terkirim'
]);
echo "Created new proyek: {$newProyek->judul}\n";

// Create new penilaian
$guru = App\Models\User::guru()->first();
if ($guru) {
    // Update proyek status first
    $newProyek->update(['status' => 'dinilai']);
    
    $newPenilaian = App\Models\Penilaian::create([
        'proyek_id' => $newProyek->id,
        'guru_id' => $guru->id,
        'nilai_bintang' => 5
    ]);
    echo "Created new penilaian: {$newPenilaian->nilai_bintang} stars by {$guru->name}\n";
}

// ===== CLEANUP TEST DATA =====

echo "\n=== Cleaning up test data ===\n";

// Delete test data
if (isset($newPenilaian)) $newPenilaian->delete();
if (isset($newProyek)) $newProyek->delete();
if (isset($newSiswa)) $newSiswa->delete();
if (isset($newJurusan)) $newJurusan->delete();

echo "Test data cleaned up!\n";

echo "\n=== All tests completed! ===\n";

?>

<!--
INDIVIDUAL TINKER COMMANDS:
Copy and paste these commands one by one in tinker

// Basic queries
App\Models\Jurusan::all()
App\Models\User::all()
App\Models\Proyek::all()
App\Models\Penilaian::all()

// Relationship queries
App\Models\User::with('jurusan')->where('role', 'siswa')->get()
App\Models\Proyek::with(['user', 'jurusan', 'penilaian'])->get()
App\Models\Penilaian::with(['proyek', 'guru'])->get()

// Scope queries
App\Models\User::guru()->get()
App\Models\User::siswa()->get()
App\Models\Proyek::terkirim()->get()
App\Models\Proyek::dinilai()->get()
App\Models\Penilaian::highRating()->get()

// Complex queries
App\Models\Jurusan::withCount(['users', 'proyeks'])->get()
App\Models\User::where('role', 'siswa')->has('proyeks')->get()
App\Models\Proyek::whereHas('penilaian', function($q) { $q->where('nilai_bintang', '>=', 4); })->get()

// Statistics
App\Models\Proyek::selectRaw('jurusan_id, count(*) as total')->groupBy('jurusan_id')->with('jurusan')->get()
App\Models\Penilaian::selectRaw('nilai_bintang, count(*) as total')->groupBy('nilai_bintang')->get()

// Helper methods testing
$user = App\Models\User::first()
$user->isGuru()
$user->isSiswa()
$user->isAdmin()
-->