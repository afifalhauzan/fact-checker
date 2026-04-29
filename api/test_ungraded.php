<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Proyek;
use App\Models\User;

echo "=== UNGRADED PROJECTS TEST ===\n";

// Test for Desain Komunikasi Visual (jurusan_id = 3)
$jurusan_id = 3;
echo "Testing for jurusan_id: {$jurusan_id}\n\n";

// Check if there are any projects with status 'terkirim' for this jurusan
echo "1. Projects with status 'terkirim' for jurusan {$jurusan_id}:\n";
$terkirimProjects = Proyek::with(['user', 'jurusan'])
    ->where('status', 'terkirim')
    ->where('jurusan_id', $jurusan_id)
    ->get();

echo "   Found: " . $terkirimProjects->count() . " projects\n";
foreach ($terkirimProjects as $project) {
    echo "   - ID: {$project->id}, Title: {$project->judul}, Student: {$project->user->name}\n";
}

echo "\n2. Projects without penilaian (ungraded):\n";
$ungradedProjects = Proyek::with(['user', 'jurusan'])
    ->where('status', 'terkirim')
    ->where('jurusan_id', $jurusan_id)
    ->whereDoesntHave('penilaian')
    ->get();

echo "   Found: " . $ungradedProjects->count() . " ungraded projects\n";
foreach ($ungradedProjects as $project) {
    echo "   - ID: {$project->id}, Title: {$project->judul}, Student: {$project->user->name}\n";
}

echo "\n3. All projects for this jurusan (any status):\n";
$allProjects = Proyek::with(['user', 'jurusan', 'penilaian'])
    ->where('jurusan_id', $jurusan_id)
    ->get();

echo "   Found: " . $allProjects->count() . " total projects\n";
foreach ($allProjects as $project) {
    $hasGrade = $project->penilaian ? 'HAS GRADE' : 'NO GRADE';
    echo "   - ID: {$project->id}, Status: {$project->status}, Title: {$project->judul}, Grade: {$hasGrade}\n";
}

echo "\n4. Check teachers for this jurusan:\n";
$teachers = User::where('role', 'guru')->where('jurusan_id', $jurusan_id)->get();
echo "   Found: " . $teachers->count() . " teachers\n";
foreach ($teachers as $teacher) {
    echo "   - {$teacher->name} (ID: {$teacher->id})\n";
}

echo "\n5. Testing the exact query from controller:\n";
$query = Proyek::with(['user', 'jurusan'])
    ->where('status', 'terkirim')
    ->where('jurusan_id', $jurusan_id)
    ->whereDoesntHave('penilaian');

$result = $query->latest()->get();
echo "   Query result count: " . $result->count() . "\n";

// Also check if there are any projects that need to be created for testing
echo "\n6. Raw SQL query for debugging:\n";
$sql = $query->toSql();
$bindings = $query->getBindings();
echo "   SQL: {$sql}\n";
echo "   Bindings: " . json_encode($bindings) . "\n";