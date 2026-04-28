<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Simple session login for docs access
Route::post('/docs-login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required'
    ]);

    if (Auth::attempt($request->only('email', 'password'))) {
        $request->session()->regenerate();
        return redirect('/docs/api');
    }

    return back()->withErrors([
        'email' => 'The provided credentials do not match our records.',
    ]);
});

// Simple login form for docs access
Route::get('/docs-login', function () {
    return view('docs-login');
});

// Logout route for docs
Route::post('/docs-logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('/docs-login');
});

require __DIR__.'/auth.php';
