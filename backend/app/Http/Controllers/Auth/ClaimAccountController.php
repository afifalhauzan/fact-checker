<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ClaimAccountController extends Controller
{
    /**
     * Claim an unregistered student account
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validation
            $request->validate([
                'nis' => 'required|exists:users,nis',
                'email' => 'required|email|unique:users,email',
                'password' => ['required', 'confirmed', Password::defaults()],
            ]);

            // Find user by NIS
            $user = User::where('nis', $request->nis)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student with this NIS not found'
                ], 404);
            }

            // Security Gate: Check if account is already claimed
            if ($user->isActive()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Account already claimed. Please contact administrator if you need assistance.'
                ], 403);
            }

            // Update user to claim account
            $user->update([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            // Load relationships for complete user data
            $user->load(['jurusan', 'kelas']);

            // Generate Sanctum token
            $token = $user->createToken('claim_auth_token')->plainTextToken;

            // Prepare user data for response
            $userData = $user->toArray();
            $userData['jurusan_name'] = $user->jurusan ? $user->jurusan->nama : null;

            return response()->json([
                'success' => true,
                'message' => 'Account claimed successfully! Welcome to SMKN 5.',
                'token' => $token,
                'user' => $userData,
                'token_type' => 'Bearer',
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to claim account',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}