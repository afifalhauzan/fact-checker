<?php

namespace App\Imports;

use App\Models\User;
use App\Models\Jurusan;
use App\Models\Kelas;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class SiswaImport implements ToModel, WithHeadingRow, WithValidation
{
    protected $importedCount = 0;
    protected $errorCount = 0;
    protected $errors = [];
    protected $failures = [];

    /**
     * Transform each row into a User model
     *
     * @param array $row
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        try {
            // Skip empty rows
            if (empty($row['nama_lengkap']) || empty($row['nis']) || empty($row['nama_kelas'])) {
                Log::info("Skipping empty row", ['row' => $row]);
                return null;
            }

            // Find Kelas by exact nama_kelas match
            $kelas = $this->findKelasByName(trim($row['nama_kelas']));
            if (!$kelas) {
                $error = "Kelas not found: " . $row['nama_kelas'];
                Log::error($error, ['row' => $row]);
                $this->errors[] = $error;
                $this->errorCount++;
                return null;
            }

            $gender = $this->parseGender($row['jenis_kelamin'] ?? 'L');

            // Create or update user with security constraints
            $user = User::updateOrCreate(
                ['nis_nip' => trim($row['nis'])],
                [
                    'name' => trim($row['nama_lengkap']),
                    'nis' => trim($row['nis']),
                    'gender' => $gender,
                    'kelas_id' => $kelas->id,
                    'jurusan_id' => $kelas->jurusan_id,
                    'role' => 'siswa',
                    'is_active' => false, 
                    'email' => null,       
                    'password' => null,   
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $this->importedCount++;

            Log::info('Student imported successfully', [
                'nis' => $user->nis,
                'name' => $user->name,
                'kelas' => $kelas->nama_kelas,
                'jurusan_id' => $kelas->jurusan_id
            ]);

            return $user;

        } catch (\Exception $e) {
            $error = 'Error importing row: ' . $e->getMessage();
            $this->errors[] = $error;
            $this->errorCount++;
            Log::error('Error importing student row', [
                'row' => $row,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Find Kelas by exact nama_kelas match
     *
     * @param string $kelasName
     * @return \App\Models\Kelas|null
     */
    protected function findKelasByName(string $kelasName): ?Kelas
    {
        if (empty($kelasName)) {
            return null;
        }

        $kelasName = trim($kelasName);

        $kelas = Kelas::whereRaw('LOWER(nama_kelas) = LOWER(?)', [$kelasName])->first();

        return $kelas;
    }

    /**
     * Parse gender from jenis_kelamin with fallback to 'L'
     *
     * @param string $jenisKelamin
     * @return string
     */
    protected function parseGender(string $jenisKelamin): string
    {
        $jenisKelamin = strtoupper(trim($jenisKelamin));
        
        // Map common variations
        $genderMap = [
            'L' => 'L',
            'LAKI-LAKI' => 'L',
            'LAKI' => 'L',
            'MALE' => 'L',
            'M' => 'L',
            'P' => 'P',
            'PEREMPUAN' => 'P',
            'FEMALE' => 'P',
            'F' => 'P'
        ];

        return $genderMap[$jenisKelamin] ?? 'L'; // Default to 'L' if not found
    }

    /**
     * Validation rules for the import
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'nama_lengkap' => 'required|string|max:255',
            'nis' => 'required|max:20', // Allow both string and numeric
            'nama_kelas' => 'required|string|max:50',
            'jenis_kelamin' => 'nullable|string|max:20',
            'no' => 'nullable|integer',
        ];
    }

    /**
     * Custom validation messages
     *
     * @return array
     */
    public function customValidationMessages(): array
    {
        return [
            'nama_lengkap.required' => 'Nama lengkap is required',
            'nis.required' => 'NIS is required',
            'nama_kelas.required' => 'Nama kelas is required',
        ];
    }

    /**
     * Get the count of successfully imported rows
     *
     * @return int
     */
    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    /**
     * Get the count of error rows
     *
     * @return int
     */
    public function getErrorCount(): int
    {
        return $this->errorCount;
    }

    /**
     * Get all errors that occurred during import
     *
     * @return array
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Get all validation failures that occurred during import
     *
     * @return array
     */
    public function getFailures(): array
    {
        return $this->failures;
    }
}