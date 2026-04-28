<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Penilaian;

echo "=== PENILAIAN VALIDATION TEST ===\n";
echo "Total Penilaian records: " . Penilaian::count() . "\n\n";

$penilaians = Penilaian::with(['guru.jurusan', 'proyek.jurusan'])->get();

foreach ($penilaians as $penilaian) {
    echo "Penilaian ID: {$penilaian->id}\n";
    echo "  Stars (bintang): {$penilaian->bintang}\n";
    echo "  Project: {$penilaian->proyek->judul}\n";
    echo "  Project Department: {$penilaian->proyek->jurusan->nama}\n";
    echo "  Guru: {$penilaian->guru->name}\n";
    echo "  Guru Department: " . ($penilaian->guru->jurusan ? $penilaian->guru->jurusan->nama : 'N/A') . "\n";
    echo "  Department Match: " . ($penilaian->guru->jurusan_id == $penilaian->proyek->jurusan_id ? 'YES' : 'NO') . "\n";
    echo "  Comment: {$penilaian->catatan}\n";
    echo "  ---\n";
}