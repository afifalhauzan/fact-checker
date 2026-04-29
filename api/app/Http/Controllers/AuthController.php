<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'nis_nip' => ['required', 'string', 'max:20', 'unique:users,nis_nip'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', 'in:guru,siswa'],
            'jurusan_id' => ['required', 'exists:jurusans,id'],
            'kelas_id' => ['required_if:role,siswa', 'exists:kelas,id'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'nis_nip' => $request->nis_nip,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'jurusan_id' => $request->jurusan_id,
            'kelas_id' => $request->role === 'siswa' ? $request->kelas_id : null,
        ]);

        $user->load(['jurusan', 'kelas']);

        // Add jurusan_name to user data
        $userData = $user->toArray();
        $userData['jurusan_name'] = $user->jurusan ? $user->jurusan->nama : null;

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $userData,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid login credentials'
            ], 401);
        }

        $user = User::where('email', $request->email)->with(['jurusan', 'kelas', 'jurusans'])->firstOrFail();

        // Add jurusan_name to user data
        $userData = $user->toArray();
        $userData['jurusan_name'] = $user->jurusan ? $user->jurusan->nama : null;
        
        // Add jurusan_ids for guru users (multiple jurusans)
        if ($user->role === 'guru') {
            $userData['jurusan_ids'] = $user->jurusans->pluck('id')->toArray();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $userData,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 200);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['jurusan', 'kelas', 'jurusans']);

        // Add jurusan_name to user data
        $userData = $user->toArray();
        $userData['jurusan_name'] = $user->jurusan ? $user->jurusan->nama : null;
        
        // Add jurusan_ids for guru users (multiple jurusans)
        if ($user->role === 'guru') {
            $userData['jurusan_ids'] = $user->jurusans->pluck('id')->toArray();
        }

        return response()->json([
            'user' => $userData
        ], 200);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        // Revoke the current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    }

    /**
     * Logout from all devices
     */
    public function logoutAll(Request $request)
    {
        // Revoke all tokens
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out from all devices successfully'
        ], 200);
    }

    /**
     * Get user statistics
     */
    public function userStats(Request $request)
    {
        $user = $request->user();

        if (in_array($user->role, ['siswa'])) {
            $stats = [
                'jumlahKarya' => $user->proyeks()->count(),
                'totalViews' => $user->proyeks()->sum('views'),
            ];
        }

        if ($user->isGuru()) {
            $stats = [
                'jumlahKarya' => $user->proyeks()->count(),
                'totalViews' => $user->proyeks()->sum('views'),
            ];
        }

        if ($user->isAdmin()) {
            $stats = [
                'totalUsers' => User::count(),
                'totalGuru' => User::where('role', 'guru')->count(),
                'totalSiswa' => User::where('role', 'siswa')->count(),
                'totalProyeks' => \App\Models\Proyek::count(),
            ];
        }

        return response()->json([
            'stats' => $stats
        ], 200);
    }
}