<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ListKelas extends Command
{
    protected $signature = 'list:kelas';
    protected $description = 'List all available kelas';

    public function handle()
    {
        $kelasList = \App\Models\Kelas::all(['id', 'nama_kelas', 'jurusan_id']);
        
        if ($kelasList->isEmpty()) {
            $this->warn('No kelas found in database.');
            return;
        }

        $this->info('Available Kelas:');
        $this->table(['ID', 'Nama Kelas', 'Jurusan ID'], 
            $kelasList->map(function($kelas) {
                return [
                    $kelas->id,
                    $kelas->nama_kelas,
                    $kelas->jurusan_id
                ];
            })
        );
        
        return 0;
    }
}