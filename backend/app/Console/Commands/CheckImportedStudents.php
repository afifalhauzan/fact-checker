<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckImportedStudents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:imported-students';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check recently imported students from Excel import';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Checking imported students...");
        
        $totalStudents = \App\Models\User::where('role', 'siswa')->count();
        $this->info("Total students: {$totalStudents}");
        
        $recentImports = \App\Models\User::where('role', 'siswa')
            ->whereNull('email')
            ->latest()
            ->take(10)
            ->get(['nis', 'name', 'role', 'is_active', 'created_at']);
            
        if ($recentImports->count() > 0) {
            $this->info("Recent imports:");
            $this->table(['NIS', 'Name', 'Role', 'Active', 'Created At'], 
                $recentImports->map(function($user) {
                    return [
                        $user->nis,
                        $user->name,
                        $user->role,
                        $user->is_active ? 'Yes' : 'No',
                        $user->created_at->format('Y-m-d H:i:s')
                    ];
                })
            );
        } else {
            $this->warn("No recent imports found.");
        }
        
        return 0;
    }
}
