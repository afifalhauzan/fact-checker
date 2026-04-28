<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;


class AkunController extends Controller
{
    /**
     * Check if the authenticated user is admin
     */
    private function checkAdminAccess()
    {
        if (!Auth::check() || Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized. Admin access required.');
        }
    }

    /**
     * Display a listing of users with pagination and filtering
     */
    public function index(Request $request): JsonResponse
    {
        $this->checkAdminAccess();
        $query = User::with(['jurusan', 'kelas', 'jurusans']);

        // Filter by role
        if ($request->has('role') && in_array($request->role, ['guru', 'siswa'])) {
            $query->where('role', $request->role);
        } else {
            // Default to showing only guru and siswa (exclude admin)
            $query->whereIn('role', ['guru', 'siswa']);
        }

        if ($request->has('jurusan_id') && $request->jurusan_id) {
            $jurusanId = $request->jurusan_id;
            $query->where(function($q) use ($jurusanId) {
                // For siswa: check direct jurusan_id column
                $q->where(function($subQ) use ($jurusanId) {
                    $subQ->where('role', 'siswa')
                         ->where('jurusan_id', $jurusanId);
                })
                // For guru: check many-to-many relationship
                ->orWhere(function($subQ) use ($jurusanId) {
                    $subQ->where('role', 'guru')
                         ->whereHas('jurusans', function($jurusanQ) use ($jurusanId) {
                             $jurusanQ->where('jurusan_id', $jurusanId);
                         });
                });
            });
        }

        if ($request->has('kelas_id') && $request->kelas_id) {
            $query->where('kelas_id', $request->kelas_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('nis_nip', 'like', "%{$search}%");
            });
        }

        // Pagination
        $limit = min($request->get('limit', 10), 50); // Max 50 items per page
        $users = $query->orderBy('created_at', 'desc')->paginate($limit);
        
        // Add jurusan_ids to guru users
        $users->getCollection()->transform(function ($user) {
            if ($user->role === 'guru') {
                $user->jurusan_ids = $user->jurusans->pluck('id')->toArray();
            }
            return $user;
        });

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ]
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request): JsonResponse
    {
        $this->checkAdminAccess();
        
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:guru,siswa',
            'nis_nip' => 'required|string|max:20|unique:users',
            'jurusan_id' => 'required|exists:jurusans,id',
            'kelas_id' => 'required_if:role,siswa|nullable|exists:kelas,id',
        ];
        
        // Add validation for guru's additional jurusans
        if ($request->role === 'guru' && $request->has('jurusan_ids')) {
            $rules['jurusan_ids'] = 'array';
            $rules['jurusan_ids.*'] = 'exists:jurusans,id';
        }
        
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'nis_nip' => $request->nis_nip,
            'jurusan_id' => $request->jurusan_id,
            'kelas_id' => $request->role === 'siswa' ? $request->kelas_id : null,
            'is_changed_password' => true, // Manually created accounts have custom passwords
        ]);
        
        // Handle multiple jurusans for guru
        if ($request->role === 'guru' && $request->has('jurusan_ids') && is_array($request->jurusan_ids)) {
            $user->jurusans()->sync($request->jurusan_ids);
        }

        $user->load(['jurusan', 'kelas', 'jurusans']);
        
        // Add jurusan_ids to response for guru
        if ($user->role === 'guru') {
            $user->jurusan_ids = $user->jurusans->pluck('id')->toArray();
        }

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    /**
     * Display the specified user
     */
    public function show($id): JsonResponse
    {
        $this->checkAdminAccess();
        $user = User::with(['jurusan', 'kelas', 'jurusans'])->find($id);

        if (!$user || $user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }
        
        // Add jurusan_ids to response for guru
        if ($user->role === 'guru') {
            $user->jurusan_ids = $user->jurusans->pluck('id')->toArray();
        }

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, $id): JsonResponse
    {
        $this->checkAdminAccess();
        $user = User::find($id);

        if (!$user || $user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'sometimes|nullable|string|min:8',
            'role' => 'sometimes|required|in:guru,siswa',
            'nis_nip' => 'sometimes|required|string|max:20|unique:users,nis_nip,' . $id,
            'jurusan_id' => 'sometimes|required|exists:jurusans,id',
            'kelas_id' => 'sometimes|nullable|exists:kelas,id',
        ];
        
        // Add validation for guru's additional jurusans
        if ($request->role === 'guru' && $request->has('jurusan_ids')) {
            $rules['jurusan_ids'] = 'array';
            $rules['jurusan_ids.*'] = 'exists:jurusans,id';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only(['name', 'email', 'role', 'nis_nip', 'jurusan_id', 'kelas_id']);

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        // Set kelas_id to null for guru role
        if ($request->role === 'guru') {
            $updateData['kelas_id'] = null;
        }

        $user->update($updateData);
        
        // Handle multiple jurusans for guru
        if ($request->role === 'guru' && $request->has('jurusan_ids') && is_array($request->jurusan_ids)) {
            $user->jurusans()->sync($request->jurusan_ids);
        }
        
        $user->load(['jurusan', 'kelas', 'jurusans']);
        
        // Add jurusan_ids to response for guru
        if ($user->role === 'guru') {
            $user->jurusan_ids = $user->jurusans->pluck('id')->toArray();
        }

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }

    /**
     * Remove the specified user
     */
    public function destroy($id): JsonResponse
    {
        $this->checkAdminAccess();
        $user = User::find($id);

        if (!$user || $user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Prevent deleting current admin user
        if ($user->id === Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete your own account'
            ], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Get statistics for dashboard
     */
    public function stats(): JsonResponse
    {
        $this->checkAdminAccess();
        $stats = [
            'total_guru' => User::where('role', 'guru')->count(),
            'total_siswa' => User::where('role', 'siswa')->count(),
            'by_jurusan' => User::whereIn('role', ['guru', 'siswa'])
                ->join('jurusans', 'users.jurusan_id', '=', 'jurusans.id')
                ->selectRaw('jurusans.nama as jurusan_name, users.role, COUNT(*) as count')
                ->groupBy('jurusans.nama', 'users.role')
                ->get()
                ->groupBy('jurusan_name'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}