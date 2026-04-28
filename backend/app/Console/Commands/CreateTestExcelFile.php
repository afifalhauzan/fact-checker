<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CreateTestExcelFile extends Command
{
    protected $signature = 'create:test-excel';
    protected $description = 'Create test Excel file for student import';

    public function handle()
    {
        $this->info('Creating test Excel file...');

        try {
            // Create test data matching our working CSV format
            $headers = [
                ['No', 'NIS', 'Nama Lengkap', 'Jenis Kelamin', 'Nama Kelas'],
                [1, '2407001', 'Ahmad Fauzan', 'L', '10 TKJT I'],
                [2, '2407002', 'Bayu Prakoso', 'L', '10 TKJT I'],
                [3, '2407003', 'Cindy Aulia', 'P', '10 TKJT II'],
                [4, '2407004', 'Dedi Kurniawan', 'L', '11 RPL I'],
                [5, '2407005', 'Erlinda Sari', 'P', '10 DKV I'],
                [6, '2407006', 'Fahmi Idris', 'L', '10 TKJT I'],
                [7, '2407007', 'Gilang Ramadhan', 'L', '11 RPL II'],
                [8, '2407008', 'Hesti Pratiwi', 'P', '10 DKV II'],
            ];

            $filename = 'test_impor_siswa.xlsx';
            $filepath = storage_path('app/' . $filename);

            // Create and save the Excel file
            \Maatwebsite\Excel\Facades\Excel::store(new class($headers) implements \Maatwebsite\Excel\Concerns\FromArray {
                protected $data;

                public function __construct($data) {
                    $this->data = $data;
                }

                public function array(): array {
                    return $this->data;
                }
            }, $filename, 'local');

            $this->info("Excel file created successfully: {$filepath}");

        } catch (\Exception $e) {
            $this->error("Failed to create Excel file: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}