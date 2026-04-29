<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Imports\SiswaImport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;

class TestSiswaImport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:siswa-import {file : The path to the Excel file to import}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test importing students from Excel/XLSX file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filename = $this->argument('file');
        $filepath = storage_path('app/' . $filename);

        if (!file_exists($filepath)) {
            $this->error("File not found: {$filepath}");
            return 1;
        }

        $this->info("Starting import from: {$filename}");

        try {
            $import = new SiswaImport();
            Excel::import($import, $filepath);

            $importedCount = $import->getImportedCount();
            $errorCount = $import->getErrorCount();
            $totalRows = $importedCount + $errorCount;

            $this->info("Import completed!");
            $this->table(['Metric', 'Count'], [
                ['Total Rows', $totalRows],
                ['Successfully Imported', $importedCount],
                ['Errors', $errorCount],
                ['Success Rate', $totalRows > 0 ? round(($importedCount / $totalRows) * 100, 2) . '%' : '0%']
            ]);

            if ($errorCount > 0) {
                $this->warn("Errors occurred during import:");
                if (method_exists($import, 'getErrors')) {
                    foreach ($import->getErrors() as $error) {
                        $this->line("- {$error}");
                    }
                } else {
                    $this->line("- Error details not available (getErrors method not implemented)");
                }

                if (method_exists($import, 'getFailures')) {
                    $this->warn("Validation failures:");
                    foreach ($import->getFailures() as $failure) {
                        if (is_array($failure)) {
                            $this->line("- Row {$failure['row']}: " . implode(', ', $failure['errors']));
                        } else {
                            $this->line("- {$failure}");
                        }
                    }
                }
            }

        } catch (\Exception $e) {
            $this->error("Import failed: " . $e->getMessage());
            $this->line("Trace: " . $e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}