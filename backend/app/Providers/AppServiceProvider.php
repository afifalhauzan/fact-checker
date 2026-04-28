<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use App\Models\User;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url')."/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });

        // Define gate for API docs access
        Gate::define('viewApiDocs', function (?User $user = null) {
            // Allow access in local environment
            if (app()->environment('local')) {
                return true;
            }
            
            // Check if user is authenticated via any guard
            if (!$user) {
                // Try to get user from different guards
                $user = auth()->guard('web')->user() ?? auth()->guard('sanctum')->user();
            }
            
            if (!$user) {
                return false;
            }
            
            // Allow access for admin users or specific emails
            return $user->role === 'admin' || in_array($user->email, [
                'admin@smkn5.com',
                'developer@smkn5.com'
            ]);
        });
    }
}
