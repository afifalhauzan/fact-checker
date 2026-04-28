<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class TestPasswordCheck extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:password-check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the password change functionality for teachers';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Password Change System...');
        
        // Find a teacher user
        $guru = User::where('role', 'guru')->first();
        
        if (!$guru) {
            $this->warn('No guru user found in database');
            return;
        }
        
        $this->info('Found teacher: ' . $guru->name);
        $this->info('Email: ' . $guru->email);
        $this->info('Role: ' . $guru->role);
        $this->info('Is Changed Password: ' . ($guru->is_changed_password ? 'true' : 'false'));
        $this->info('Needs Password Change: ' . ($guru->needsPasswordChange() ? 'true' : 'false'));
        
        if ($guru->needsPasswordChange()) {
            $this->warn('⚠️  This teacher needs to change their password!');
        } else {
            $this->info('✅ This teacher has already changed their password');
        }
        
        // Show statistics
        $needsChange = User::where('role', 'guru')
            ->where('is_changed_password', false)
            ->count();
            
        $total = User::where('role', 'guru')->count();
        
        $this->newLine();
        $this->info("Password Change Statistics:");
        $this->info("Total Teachers: {$total}");
        $this->info("Need Password Change: {$needsChange}");
        $this->info("Already Changed: " . ($total - $needsChange));
        
        return 0;
    }
}
