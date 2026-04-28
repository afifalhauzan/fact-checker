<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Imports\GuruImport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException;
use Maatwebsite\Excel\Concerns\FromArray;

class TeacherImportController extends Controller
{
    /**
     * Import teachers from Excel file
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

            $import = new GuruImport();

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
            Log::error('Teacher import error', [
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
            $filename = 'template_import_guru.xlsx';
            $filePath = storage_path('app/' . $filename);

            // If static template file exists, use it
            if (file_exists($filePath)) {
                return response()->download($filePath, $filename, [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]);
            }

            // Generate template dynamically if static file doesn't exist
            $templateData = [
                ['No', 'NIP', 'Nama Lengkap'],
                ['1', '198501012010121001', 'Ahmad Sudrajat, S.Pd'],
                ['2', '198703152011012002', 'Siti Nurhaliza, S.Kom'],
                ['3', '199002201012121003', 'Budi Santoso, M.Pd'],
            ];

            // Create a temporary file with the template
            $tempFile = tempnam(sys_get_temp_dir(), 'template_guru');
            
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
            $totalGuru = \App\Models\User::where('role', 'guru')->count();
            $activeGuru = \App\Models\User::where('role', 'guru')->where('is_active', true)->count();
            $inactiveGuru = \App\Models\User::where('role', 'guru')->where('is_active', false)->count();

            // Get recent imports (teachers created in last 7 days)
            $recentImports = \App\Models\User::where('role', 'guru')
                ->where('created_at', '>=', now()->subDays(7))
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_guru' => $totalGuru,
                    'active_guru' => $activeGuru,
                    'inactive_guru' => $inactiveGuru,
                    'recent_imports_7_days' => $recentImports,
                    'import_guidelines' => [
                        'required_columns' => ['No', 'NIP', 'Nama Lengkap'],
                        'email_generation' => 'Auto-generated from nama_lengkap (lowercase, no spaces)',
                        'default_password' => 'password (can be changed after first login)',
                        'security_note' => 'Teachers are active by default with auto-generated email',
                        'max_file_size' => '10MB',
                        'supported_formats' => ['xlsx', 'xls', 'csv'],
                        'jurusan_assignment' => 'Teachers can be assigned to multiple departments later'
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Teacher import status error', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving import status: ' . $e->getMessage()
            ], 500);
        }
    }
}