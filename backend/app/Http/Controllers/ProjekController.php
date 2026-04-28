<?php

namespace App\Http\Controllers;

use App\Models\Proyek;
use App\Models\Jurusan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;

class ProjekController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Proyek::with(['user.kelas', 'jurusan', 'penilaian.guru']);
            $user = Auth::user();

            // For public access (no authentication), only show published projects
            if (!$user) {
                $query->published();
            } elseif ($user->role === 'guru' && $user->jurusan_id) {
                // Teacher-specific logic: include terkirim projects from their department
                if ($request->has('status')) {
                    if ($request->status === 'terkirim') {
                        // Only show terkirim projects from teacher's department
                        $query->where('status', 'terkirim')
                              ->where('jurusan_id', $user->jurusan_id);
                    } else {
                        $query->byStatus($request->status);
                    }
                } else {
                    // Default: show dinilai projects + terkirim from teacher's department
                    $query->where(function($q) use ($user) {
                        $q->where('status', 'dinilai')
                          ->orWhere(function($subQ) use ($user) {
                              $subQ->where('status', 'terkirim')
                                   ->where('jurusan_id', $user->jurusan_id);
                          });
                    });
                }
            } else {
                // Admin and other authenticated users: can see all projects
                // Apply status filter if provided
                if ($request->has('status')) {
                    $query->byStatus($request->status);
                }
            }

            // Filter by jurusan if provided
            if ($request->has('jurusan_id')) {
                $query->where('jurusan_id', $request->jurusan_id);
            }

            // Filter by year if provided
            if ($request->has('year')) {
                $year = $request->year;
                $query->whereYear('created_at', $year);
            }

            // Filter by kelas tingkat if provided (X, XI, XII)
            if ($request->has('kelas')) {
                $kelasFilter = $request->kelas;
                if (in_array($kelasFilter, ['X', 'XI', 'XII'])) {
                    $query->whereHas('user.kelas', function ($q) use ($kelasFilter) {
                        $q->where('tingkat', $kelasFilter);
                    });
                }
            }

            // Search by title or description
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('judul', 'like', "%{$search}%")
                        ->orWhere('deskripsi', 'like', "%{$search}%");
                });
            }

            // Pagination
            $page = $request->get('page', 1);
            $requestedLimit = $request->get('limit', 10);
            $limit = min($requestedLimit, 50); // Enforce maximum of 50 for admin, more reasonable limit

            $proyeks = $query->latest()
                ->paginate($limit, ['*'], 'page', $page);

            // Debug info for troubleshooting
            $debug = [
                'user_role' => $user ? $user->role : 'unauthenticated',
                'total_projects_in_db' => Proyek::count(),
                'query_conditions_applied' => $request->only(['status', 'jurusan_id', 'year', 'kelas', 'search']),
                'pagination_limit' => $limit,
            ];

            return response()->json([
                'success' => true,
                'data' => $proyeks->items(),
                'pagination' => [
                    'current_page' => $proyeks->currentPage(),
                    'last_page' => $proyeks->lastPage(),
                    'per_page' => $proyeks->perPage(),
                    'total' => $proyeks->total(),
                    'from' => $proyeks->firstItem(),
                    'to' => $proyeks->lastItem(),
                ],
                'debug' => config('app.debug') ? $debug : null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch projects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'judul' => 'required|string|max:255',
                'deskripsi' => 'required|string',
                'tautan_proyek' => 'nullable|url|max:500',
                'youtube_url' => 'nullable|url|max:500',
                'media_type' => 'nullable|in:image,youtube,link',
                'image_url' => 'nullable|url|max:500',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'jurusan_id' => 'required|exists:jurusans,id',
                'status' => 'in:terkirim,dinilai',
                'is_published' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->except('image');
            $uploadInfo = null;

            // Handle YouTube URL - store it in tautan_proyek field
            $projectUrl = null;
            if ($request->youtube_url) {
                $projectUrl = $request->youtube_url;
            } elseif ($request->tautan_proyek) {
                $projectUrl = $request->tautan_proyek;
            }

            // Handle image upload with detailed feedback
            if ($request->hasFile('image')) {
                $imageFile = $request->file('image');

                // Get original file info
                $originalName = $imageFile->getClientOriginalName();
                $originalSize = $imageFile->getSize();
                $mimeType = $imageFile->getMimeType();
                $extension = $imageFile->getClientOriginalExtension();

                // Validate file integrity
                if (!$imageFile->isValid()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid file upload',
                        'error' => 'The uploaded file is corrupted or incomplete'
                    ], 400);
                }

                try {
                    // Store file with original name preservation
                    $fileName = time() . '_' . str_replace(' ', '_', $originalName);
                    $path = $imageFile->storeAs('projects', $fileName, 'public');

                    if (!$path) {
                        throw new \Exception('Failed to store file');
                    }

                    // Verify file was actually stored
                    $fullPath = storage_path('app/public/' . $path);
                    if (!file_exists($fullPath)) {
                        throw new \Exception('File verification failed after upload');
                    }

                    $data['image_url'] = '/storage/' . $path;

                    // Prepare upload info for response
                    $uploadInfo = [
                        'original_name' => $originalName,
                        'stored_name' => $fileName,
                        'size' => $originalSize,
                        'size_formatted' => $this->formatBytes($originalSize),
                        'mime_type' => $mimeType,
                        'extension' => $extension,
                        'url' => '/storage/' . $path,
                        'path' => $path,
                        'uploaded_at' => now()->toISOString()
                    ];

                } catch (\Exception $uploadException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Image upload failed',
                        'error' => $uploadException->getMessage(),
                        'upload_details' => [
                            'original_name' => $originalName,
                            'size' => $this->formatBytes($originalSize),
                            'type' => $mimeType
                        ]
                    ], 500);
                }
            }

            // Create the project
            $proyek = Proyek::create([
                'user_id' => Auth::id(),
                'jurusan_id' => $request->jurusan_id,
                'judul' => $request->judul,
                'deskripsi' => $request->deskripsi,
                'tautan_proyek' => $projectUrl,
                'image_url' => $data['image_url'] ?? $request->image_url,
                'status' => $request->status ?? 'terkirim',
                'is_published' => $request->is_published ?? false,
            ]);

            $proyek->load(['user', 'jurusan', 'penilaian.guru']);

            // Prepare comprehensive success response
            $response = [
                'success' => true,
                'message' => 'Project created successfully',
                'data' => $proyek
            ];

            // Add upload info if image was uploaded
            if ($uploadInfo) {
                $response['upload_info'] = $uploadInfo;
                $response['message'] = 'Project created successfully with image upload';
            }

            return response()->json($response, 201);

        } catch (\Exception $e) {
            // Clean up uploaded file if project creation fails
            if (isset($path) && $path) {
                $fullPath = storage_path('app/public/' . $path);
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to create project',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $proyek = Proyek::with(['user.kelas', 'jurusan', 'penilaian.guru'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $proyek
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch project',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $proyek = Proyek::findOrFail($id);

            Log::info('Method:', [$request->method()]);
            Log::info('Content-Type:', [$request->header('Content-Type')]);
            Log::info('All Data:', $request->all()); // Cek apakah judul/deskripsi ada di sini
            Log::info('Has File:', [$request->hasFile('image')]);

            // Check if user owns this project or is admin
            $currentUser = Auth::user();
            if ($proyek->user_id !== $currentUser->id && $currentUser->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this project',
                    'debug' => [
                        'project_user_id' => $proyek->user_id,
                        'current_user_id' => $currentUser->id,
                        'user_role' => $currentUser->role,
                        'auth_id' => Auth::id()
                    ]
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'judul' => 'sometimes|required|string|max:255',
                'deskripsi' => 'sometimes|required|string',
                'tautan_proyek' => 'nullable|url|max:500',
                'youtube_url' => 'nullable|url|max:500',
                'media_type' => 'nullable|in:image,youtube,link',
                'image_url' => 'nullable|url|max:500',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'jurusan_id' => 'sometimes|required|exists:jurusans,id',
                'status' => 'sometimes|in:terkirim,dinilai',
                'is_published' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->except('image');
            $uploadInfo = null;

            // Handle YouTube URL - store it in tautan_proyek field
            if ($request->has('youtube_url')) {
                $data['tautan_proyek'] = $request->youtube_url;
                // Remove youtube_url from data since it's not a database field
                unset($data['youtube_url']);
            }

            // Handle image upload if provided
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($proyek->image_url && str_starts_with($proyek->image_url, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $proyek->image_url);
                    $oldFullPath = storage_path('app/public/' . $oldPath);
                    if (file_exists($oldFullPath)) {
                        unlink($oldFullPath);
                    }
                }

                $imageFile = $request->file('image');
                $originalName = $imageFile->getClientOriginalName();
                $fileName = time() . '_' . str_replace(' ', '_', $originalName);
                $path = $imageFile->storeAs('projects', $fileName, 'public');

                if ($path) {
                    $data['image_url'] = '/storage/' . $path;
                    $uploadInfo = [
                        'original_name' => $originalName,
                        'stored_name' => $fileName,
                        'url' => '/storage/' . $path
                    ];
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload image'
                    ], 500);
                }
            }

            $proyek->update($data);

            $proyek->load(['user', 'jurusan', 'penilaian.guru']);

            // Prepare comprehensive success response
            $response = [
                'success' => true,
                'message' => 'Project updated successfully',
                'data' => $proyek
            ];

            // Add upload info if image was uploaded
            if ($uploadInfo) {
                $response['upload_info'] = $uploadInfo;
                $response['message'] = 'Project updated successfully with image upload';
            }

            return response()->json($response);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update project',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Update the publication status of a specific project
     */
    public function updatePublishStatus(Request $request, string $id): JsonResponse
    {
        try {
            $proyek = Proyek::findOrFail($id);

            // Check if user owns this project or is admin/guru
            $currentUser = Auth::user();
            
            // Only admin, guru (teacher), or project owner can update publication status
            if ($currentUser->role === 'siswa' && $proyek->user_id !== $currentUser->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update publication status of this project'
                ], 403);
            }

            // For guru, they can only update projects from their department
            if ($currentUser->role === 'guru' && $currentUser->jurusan_id !== $proyek->jurusan_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update projects from other departments'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'is_published' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $proyek->update([
                'is_published' => $request->is_published
            ]);

            $proyek->load(['user.kelas', 'jurusan', 'penilaian.guru']);

            return response()->json([
                'success' => true,
                'message' => $request->is_published 
                    ? 'Project published successfully' 
                    : 'Project unpublished successfully',
                'data' => $proyek
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update publication status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $proyek = Proyek::findOrFail($id);

            // Check if user owns this project or is admin
            if ($proyek->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete this project'
                ], 403);
            }

            $proyek->delete();

            return response()->json([
                'success' => true,
                'message' => 'Project deleted successfully'
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete project',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get projects by current authenticated user
     */
    public function myProjects(Request $request): JsonResponse
    {
        try {
            $query = Proyek::with(['jurusan', 'penilaian.guru'])
                ->where('user_id', Auth::id());

            // Filter by status if provided
            if ($request->has('status')) {
                $query->byStatus($request->status);
            }

            // Pagination
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 5);

            $proyeks = $query->latest()
                ->paginate($limit, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $proyeks->items(),
                'pagination' => [
                    'current_page' => $proyeks->currentPage(),
                    'last_page' => $proyeks->lastPage(),
                    'per_page' => $proyeks->perPage(),
                    'total' => $proyeks->total(),
                    'from' => $proyeks->firstItem(),
                    'to' => $proyeks->lastItem(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user projects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get ungraded projects for teachers (projects needing assessment)
     */
    public function ungraded(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            // Only teachers can access this endpoint
            if (!$user || $user->role !== 'guru') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only teachers can access ungraded projects.'
                ], 403);
            }

            // Get guru's assigned jurusan IDs
            $guruJurusanIds = $user->getJurusanIds();
            
            if (empty($guruJurusanIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No assigned departments found. Please contact administrator.'
                ], 403);
            }

            $query = Proyek::with(['user.kelas', 'jurusan'])
                ->where('status', 'terkirim')
                ->whereIn('jurusan_id', $guruJurusanIds)
                ->whereDoesntHave('penilaian'); // Projects without any assessment

            // Search by title or description
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('judul', 'like', "%{$search}%")
                        ->orWhere('deskripsi', 'like', "%{$search}%");
                });
            }

            // Filter by year if provided
            if ($request->has('year')) {
                $year = $request->year;
                $query->whereYear('created_at', $year);
            }

            // Filter by kelas tingkat if provided
            if ($request->has('kelas')) {
                $kelasFilter = $request->kelas;
                
                // Map various input formats to database values
                $tingkatMap = [
                    '10' => ['X', '10', 'x'],
                    '11' => ['XI', '11', 'xi'],
                    '12' => ['XII', '12', 'xii'],
                    'X' => ['X', '10', 'x'],
                    'XI' => ['XI', '11', 'xi'], 
                    'XII' => ['XII', '12', 'xii'],
                    'x' => ['X', '10', 'x'],
                    'xi' => ['XI', '11', 'xi'],
                    'xii' => ['XII', '12', 'xii']
                ];
                
                if (isset($tingkatMap[$kelasFilter])) {
                    $query->whereHas('user.kelas', function ($q) use ($tingkatMap, $kelasFilter) {
                        $q->whereIn('tingkat', $tingkatMap[$kelasFilter]);
                    });
                }
            }

            // Pagination
            $page = $request->get('page', 1);
            $requestedLimit = $request->get('limit', 10);
            $limit = min($requestedLimit, 20); // Maximum 20 for ungraded view

            $proyeks = $query->latest()
                ->paginate($limit, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $proyeks->items(),
                'pagination' => [
                    'current_page' => $proyeks->currentPage(),
                    'last_page' => $proyeks->lastPage(),
                    'per_page' => $proyeks->perPage(),
                    'total' => $proyeks->total(),
                    'from' => $proyeks->firstItem(),
                    'to' => $proyeks->lastItem(),
                ],
                'message' => $proyeks->total() > 0 
                    ? "Found {$proyeks->total()} ungraded projects from your assigned departments" 
                    : "No ungraded projects found from your assigned departments"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ungraded projects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the best projects (5 stars) for homepage display
     */
    public function best(): JsonResponse
    {
        try {
            $proyeks = Proyek::with(['user.kelas', 'jurusan', 'penilaian.guru'])
                ->whereHas('penilaian', function ($query) {
                    $query->where('bintang', 5);
                })
                ->where('status', 'dinilai')
                ->published()
                ->latest()
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $proyeks
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch best projects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the latest 5 projects for homepage/gallery preview
     */
    public function latest(): JsonResponse
    {
        try {
            $proyeks = Proyek::with(['user.kelas', 'jurusan', 'penilaian.guru'])
                ->where('status', 'dinilai') // Only show graded projects
                ->published()
                ->latest()
                ->take(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $proyeks
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch latest projects',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
