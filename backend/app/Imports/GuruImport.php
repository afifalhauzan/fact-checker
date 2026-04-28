<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;

class GuruImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError, SkipsOnFailure
{
    use Importable, SkipsErrors, SkipsFailures;

    private $importedCount = 0;
    private $errorCount = 0;

    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        try {
            // Skip empty rows
            if (empty($row['nip']) || empty($row['nama_lengkap'])) {
                $this->errorCount++;
                Log::warning('Skipping empty row in guru import', ['row' => $row]);
                return null;
            }

            // Convert NIP to string to handle Excel number formatting
            $nip = (string) $row['nip'];
            
            // Generate email from nama_lengkap
            $email = $this->generateEmail($row['nama_lengkap']);

            // Check if NIP already exists
            if (User::where('nis_nip', $nip)->exists()) {
                $this->errorCount++;
                Log::warning('Duplicate NIP found', ['nip' => $nip]);
                return null;
            }

            // Check if email already exists
            if (User::where('email', $email)->exists()) {
                // If email exists, try with NIP suffix
                $email = $this->generateEmail($row['nama_lengkap'], $nip);
            }

            $guru = User::create([
                'name' => $row['nama_lengkap'],
                'nis_nip' => $nip,
                'email' => $email,
                'password' => Hash::make('password'), // Default password
                'role' => 'guru',
                'jurusan_id' => null, // Null for guru, they use many-to-many relationship
                'kelas_id' => null,
                'nis' => null,
                'gender' => null,
                'is_active' => true, // Teachers are active by default
                'is_alumni' => false,
                'is_changed_password' => false, // Flag that password needs to be changed
                'email_verified_at' => now(), // Auto-verify imported teachers
            ]);

            $this->importedCount++;
            Log::info('Teacher imported successfully', [
                'nip' => $nip,
                'name' => $row['nama_lengkap'],
                'email' => $email
            ]);

            return $guru;

        } catch (\Exception $e) {
            $this->errorCount++;
            Log::error('Error importing teacher', [
                'row' => $row,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Generate email from name
     */
    private function generateEmail(string $namaLengkap, string $nip = null): string
    {
        // Clean the name: remove titles, dots, commas
        $cleanName = preg_replace('/\b(S\.Pd|S\.Kom|M\.Pd|M\.Kom|Dr\.|Prof\.)\b/i', '', $namaLengkap);
        $cleanName = str_replace([',', '.', '  '], [' ', ' ', ' '], $cleanName);
        $cleanName = trim($cleanName);

        // Convert to lowercase and replace spaces with dots
        $email = strtolower(str_replace(' ', '.', $cleanName));
        
        // Remove special characters except dots
        $email = preg_replace('/[^a-z0-9.]/', '', $email);
        
        // Remove consecutive dots
        $email = preg_replace('/\.+/', '.', $email);
        
        // Remove leading/trailing dots
        $email = trim($email, '.');

        // Add NIP suffix if provided (for duplicate handling)
        if ($nip) {
            $email .= '.' . substr($nip, -4); // Last 4 digits of NIP
        }

        // Add domain
        $email .= '@smkn5solo.sch.id';

        return $email;
    }

    /**
     * Validation rules for each row
     */
    public function rules(): array
    {
        return [
            'nip' => [
                'required',
                'min:10',
                'max:25',
                function ($attribute, $value, $fail) {
                    // Convert to string for validation
                    $nipString = (string) $value;
                    if (User::where('nis_nip', $nipString)->exists()) {
                        $fail('NIP ' . $nipString . ' sudah terdaftar.');
                    }
                }
            ],
            'nama_lengkap' => [
                'required',
                'string',
                'min:3',
                'max:255'
            ]
        ];
    }

    /**
     * Custom validation messages
     */
    public function customValidationMessages()
    {
        return [
            'nip.required' => 'NIP harus diisi',
            'nip.min' => 'NIP minimal 10 karakter',
            'nip.max' => 'NIP maksimal 25 karakter',
            'nama_lengkap.required' => 'Nama lengkap harus diisi',
            'nama_lengkap.min' => 'Nama lengkap minimal 3 karakter',
            'nama_lengkap.max' => 'Nama lengkap maksimal 255 karakter',
        ];
    }

    /**
     * Get imported count
     */
    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    /**
     * Get error count
     */
    public function getErrorCount(): int
    {
        return $this->errorCount;
    }

    /**
     * Handle row import errors
     */
    public function onError(\Throwable $e)
    {
        $this->errorCount++;
        Log::error('Row import error in GuruImport', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }

    /**
     * Handle validation failures
     */
    public function onFailure(\Maatwebsite\Excel\Validators\Failure ...$failures)
    {
        foreach ($failures as $failure) {
            $this->errorCount++;
            Log::warning('Validation failure in GuruImport', [
                'row' => $failure->row(),
                'attribute' => $failure->attribute(),
                'errors' => $failure->errors(),
                'values' => $failure->values()
            ]);
        }
    }
}