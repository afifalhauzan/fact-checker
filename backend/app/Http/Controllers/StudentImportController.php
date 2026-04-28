<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Imports\SiswaImport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException;
use Maatwebsite\Excel\Concerns\FromArray;

class StudentImportController extends Controller
{
    /**
     * Import students from Excel file
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function import(Request $request): JsonResponse
    {
        try {
            // Check if user is authenticated and is admin
            if (!auth()->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 401);
            }

            $user = auth()->user();
            if (!$user->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $request->validate([
                'file' => 'required|file|mimes:xlsx,xls,csv|max:10240' // 10MB max
            ]);

            $file = $request->file('file');

            $import = new SiswaImport();

            Excel::import($import, $file);

            $importedCount = $import->getImportedCount();
            $errorCount = $import->getErrorCount();
            $totalRows = $importedCount + $errorCount;

            $message = "Import completed successfully";
            if ($errorCount > 0) {
                $message .= " with {$errorCount} errors";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'total_rows' => $totalRows,
                    'imported_rows' => $importedCount,
                    'error_rows' => $errorCount,
                    'success_rate' => $totalRows > 0 ? round(($importedCount / $totalRows) * 100, 2) : 0
                ]
            ], 200);

        } catch (ValidationException $e) {
            $errors = [];
            foreach ($e->errors() as $error) {
                $errors[] = $error;
            }

            Log::error('Excel validation errors', ['errors' => $errors]);

            return response()->json([
                'success' => false,
                'message' => 'Validation errors found in Excel file',
                'errors' => $errors
            ], 422);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Handle request validation errors
            return response()->json([
                'success' => false,
                'message' => 'Invalid file upload',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Student import error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during import: ' . $e->getMessage(),
                'error_details' => app()->isLocal() ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Download template Excel file
     *
     * @return \Illuminate\Http\Response
     */
    public function downloadTemplate()
    {
        try {
            $filename = 'template_import_siswa.xlsx';
            $filePath = storage_path('app/' . $filename);

            // If static template file exists, use it
            if (file_exists($filePath)) {
                return response()->download($filePath, $filename, [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]);
            }

            // Generate template dynamically if static file doesn't exist
            $templateData = [
                ['No', 'NIS', 'Nama Lengkap', 'Jenis Kelamin', 'Nama Kelas'],
                ['1', '2024001', 'John Doe', 'L', '10 RPL I'],
                ['2', '2024002', 'Jane Smith', 'P', '11 TKJT II'],
                ['3', '2024003', 'Ahmad Rahman', 'L', '12 DKV I'],
            ];

            // Create a temporary file with the template
            $tempFile = tempnam(sys_get_temp_dir(), 'template_siswa');
            
            // Use a simple implementation with FromArray
            $export = new class($templateData) implements FromArray {
                private $data;
                
                public function __construct($data) {
                    $this->data = $data;
                }
                
                public function array(): array {
                    return $this->data;
                }
            };

            Excel::store($export, basename($tempFile) . '.xlsx', 'local');
            $generatedPath = storage_path('app/' . basename($tempFile) . '.xlsx');

            return response()->download($generatedPath, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            Log::error('Template download error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error downloading template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get import status/statistics
     *
     * @return JsonResponse
     */
    public function getImportStatus(): JsonResponse
    {
        try {
            // Check if user is authenticated and is admin
            if (!auth()->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 401);
            }

            $user = auth()->user();
            if (!$user->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            // Get basic statistics
            $totalSiswa = \App\Models\User::where('role', 'siswa')->count();
            $activeSiswa = \App\Models\User::where('role', 'siswa')->where('is_active', true)->count();
            $inactiveSiswa = \App\Models\User::where('role', 'siswa')->where('is_active', false)->count();

            // Get recent imports (students with null email - indicating imported)
            $recentImports = \App\Models\User::where('role', 'siswa')
                ->whereNull('email')
                ->where('created_at', '>=', now()->subDays(7))
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_siswa' => $totalSiswa,
                    'active_siswa' => $activeSiswa,
                    'inactive_siswa' => $inactiveSiswa,
                    'recent_imports_7_days' => $recentImports,
                    'import_guidelines' => [
                        'required_columns' => ['No', 'NIS', 'Nama Lengkap', 'Jenis Kelamin', 'Nama Kelas'],
                        'gender_options' => ['L', 'P', 'Laki-laki', 'Perempuan'],
                        'class_examples' => ['10 RPL I', '11 TKJT II', '12 DKV I', '10 Animasi I'],
                        'security_note' => 'Imported students are inactive by default and have no email/password',
                        'max_file_size' => '10MB',
                        'supported_formats' => ['xlsx', 'xls', 'csv']
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Import status error', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving import status: ' . $e->getMessage()
            ], 500);
        }
    }
}