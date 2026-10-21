<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

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
        // Requests arrive through the web app's server, so the IP alone would be shared by every user
        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(6)->by(
            Str::lower((string) $request->input('email')).'|'.$request->ip(),
        ));

        // TelaahBareng flood limits per account (design doc 5.5)
        RateLimiter::for('telaah-post', fn (Request $request) => Limit::perDay(5)->by($request->user()?->id));
        RateLimiter::for('telaah-comment', fn (Request $request) => Limit::perHour(20)->by($request->user()?->id));
    }
}
