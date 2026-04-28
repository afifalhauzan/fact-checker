<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class PasswordCheckController extends Controller
{
    /**
     * Check if teacher needs to change their password
     * This endpoint is called every time a guru logs into the dashboard
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function checkPasswordStatus(Request $request): JsonResponse
    {
        try {
            // Ensure user is authenticated
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 401);
            }

            $user = Auth::user();

            // Only check for guru role
            if ($user->role !== 'guru') {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'needs_password_change' => false,
                        'message' => 'Password check not required for this role'
                    ]
                ]);
            }

            // Check if guru needs to change password
            $needsPasswordChange = $user->needsPasswordChange();

            return response()->json([
                'success' => true,
                'data' => [
                    'needs_password_change' => $needsPasswordChange,
                    'user_id' => $user->id,
                    'role' => $user->role,
                    'is_changed_password' => $user->is_changed_password,
                    'message' => $needsPasswordChange 
                        ? 'Password change required for security' 
                        : 'Password status is current'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error checking password status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change password for authenticated teacher
     * Also marks password as changed to prevent future redirects
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            // Ensure user is authenticated
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 401);
            }

            $user = Auth::user();

            // Validate request
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if current password is correct
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 422);
            }

            // Update password and mark as changed
            $user->update([
                'password' => Hash::make($request->new_password),
                'is_changed_password' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully',
                'data' => [
                    'is_changed_password' => true,
                    'changed_at' => now()->toDateTimeString()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error changing password: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get password requirements and guidelines
     * This is a public endpoint as it doesn't expose sensitive data
     *
     * @return JsonResponse
     */
    public function getPasswordRequirements(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'requirements' => [
                    'min_length' => 8,
                    'must_contain' => [
                        'At least 8 characters',
                        'Mix of letters and numbers recommended',
                        'No spaces allowed'
                    ]
                ],
                'security_tips' => [
                    'Use a unique password not used elsewhere',
                    'Consider using a passphrase',
                    'Change password regularly',
                    'Do not share your password'
                ],
                'default_info' => [
                    'message' => 'Your account was created with a default password',
                    'recommendation' => 'Please change it immediately for security'
                ]
            ]
        ]);
    }
}
