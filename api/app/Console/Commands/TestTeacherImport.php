<?php

namespace App\Console\Commands;

use App\Imports\GuruImport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class TestTeacherImport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:teacher-import {file? : Excel file path in storage}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test teacher import functionality from Excel file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧪 Testing Teacher Import Functionality');
        $this->newLine();

        $filePath = $this->argument('file');

        if (!$filePath) {
            // Use the existing template file or create new one
            $testFile = 'template_import_guru.xlsx';
            
            if (!Storage::exists($testFile)) {
                $this->info('Creating test Excel file...');
                $testData = $this->createTestData();
                
                // Store test file
                $export = new class($testData) implements \Maatwebsite\Excel\Concerns\FromArray {
                    private $data;
                    public function __construct($data) { $this->data = $data; }
                    public function array(): array { return $this->data; }
                };
                
                Excel::store($export, $testFile, 'local');
                $this->info("✅ Test file created: storage/app/{$testFile}");
            } else {
                $this->info("📁 Using existing template file: storage/app/{$testFile}");
            }
            
            $filePath = $testFile;
        }

        // Check if file exists
        if (!Storage::exists($filePath)) {
            $this->error("❌ File not found: {$filePath}");
            $this->info("Available files in storage:");
            foreach (Storage::files() as $file) {
                if (str_ends_with($file, '.xlsx') || str_ends_with($file, '.xls')) {
                    $this->line("  - {$file}");
                }
            }
            return 1;
        }

        $this->info("📁 Importing from: {$filePath}");
        $this->newLine();

        // Perform import
        try {
            $import = new GuruImport();
            $fullPath = storage_path('app' . DIRECTORY_SEPARATOR . $filePath);
            
            $this->info('⚡ Starting import...');
            $this->line("   Full path: {$fullPath}");
            
            Excel::import($import, $fullPath);

            // Display results
            $this->displayResults($import);

        } catch (\Exception $e) {
            $this->error("❌ Import failed: " . $e->getMessage());
            if ($this->option('verbose')) {
                $this->error($e->getTraceAsString());
            }
            return 1;
        }

        return 0;
    }

    /**
     * Create test data for import
     */
    private function createTestData(): array
    {
        return [
            ['No', 'NIP', 'Nama Lengkap'],
            [1, '198501012010121001', 'Ahmad Sudrajat, S.Pd'],
            [2, '198703152011012002', 'Siti Nurhaliza, S.Kom'],
            [3, '199002201012121003', 'Budi Santoso, M.Pd'],
            [4, '199105251014012004', 'Maria Kristina, S.Si'],
            [5, '198812101015121005', 'Joko Widodo, M.Kom'],
            [6, '199203181016012006', 'Dewi Sartika, S.Pd'],
            [7, '198909151017121007', 'Rizki Ramadhan, S.T'],
            [8, '199804221018012008', 'Nur Cahyati, S.Kom'],
        ];
    }

    /**
     * Display import results
     */
    private function displayResults(GuruImport $import): void
    {
        $imported = $import->getImportedCount();
        $errors = $import->getErrorCount();
        $total = $imported + $errors;

        $this->newLine();
        $this->info('📊 IMPORT RESULTS');
        $this->table(
            ['Metric', 'Count', 'Percentage'],
            [
                ['Total Rows Processed', $total, '100%'],
                ['Successfully Imported', $imported, $total > 0 ? round(($imported / $total) * 100, 1) . '%' : '0%'],
                ['Failed/Errors', $errors, $total > 0 ? round(($errors / $total) * 100, 1) . '%' : '0%'],
            ]
        );

        if ($imported > 0) {
            $this->info("✅ {$imported} teachers imported successfully!");
            
            // Show sample of imported teachers
            $recentTeachers = \App\Models\User::where('role', 'guru')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['name', 'nis_nip', 'email', 'created_at']);

            if ($recentTeachers->isNotEmpty()) {
                $this->newLine();
                $this->info('👥 Recently Imported Teachers:');
                $this->table(
                    ['Name', 'NIP', 'Email', 'Created'],
                    $recentTeachers->map(function ($teacher) {
                        return [
                            $teacher->name,
                            $teacher->nis_nip,
                            $teacher->email,
                            $teacher->created_at->format('Y-m-d H:i:s')
                        ];
                    })->toArray()
                );
            }
        }

        if ($errors > 0) {
            $this->warn("⚠️  {$errors} rows failed to import");
            $this->info("Check logs for detailed error information");
        }

        // Overall statistics
        $totalGuru = \App\Models\User::where('role', 'guru')->count();
        $this->newLine();
        $this->info("📈 Current Statistics:");
        $this->line("   Total Teachers in System: {$totalGuru}");
        $this->line("   Active Teachers: " . \App\Models\User::where('role', 'guru')->where('is_active', true)->count());
    }
}