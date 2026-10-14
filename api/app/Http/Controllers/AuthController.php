<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Create an account and sign it in.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create($data);

        return $this->tokenResponse($user, 201);
    }

    /**
     * Issue a Sanctum token for the given credentials.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        return $this->tokenResponse($user);
    }

    /**
     * Return the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    /**
     * Revoke the token used for the current request.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    private function tokenResponse(User $user, int $status = 200): JsonResponse
    {
        return response()->json([
            'token' => $user->createToken('web')->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user,
        ], $status);
    }
}
