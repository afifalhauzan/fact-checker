<?php

namespace App\Http\Controllers;

use App\Models\HeroImage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class HeroCarouselController extends Controller
{
    /**
     * Display a listing of hero images for admin
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Check admin authorization
            if (!Auth::user() || Auth::user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $query = HeroImage::query();
            
            // Filter by active status if requested
            if ($request->has('active')) {
                $active = filter_var($request->active, FILTER_VALIDATE_BOOLEAN);
                $query->where('is_active', $active);
            }
            
            $heroImages = $query->ordered()->get();
            
            return response()->json([
                'success' => true,
                'data' => $heroImages
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch hero images',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created hero image
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Check admin authorization
            if (!Auth::user() || Auth::user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'subtitle' => 'required|string|max:1000',
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'is_active' => 'boolean',
                'sort_order' => 'integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $uploadInfo = null;
            $imageUrl = null;

            // Handle required image upload
            if ($request->hasFile('image')) {
                $imageFile = $request->file('image');
                
                // Get file info
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
                    // Store with unique filename
                    $fileName = 'hero_' . time() . '_' . str_replace(' ', '_', $originalName);
                    $path = $imageFile->storeAs('hero-images', $fileName, 'public');

                    if (!$path) {
                        throw new \Exception('Failed to store file');
                    }

                    // Verify file storage (only in non-testing environment)
                    if (!app()->environment('testing')) {
                        $fullPath = storage_path('app/public/' . $path);
                        if (!file_exists($fullPath)) {
                            throw new \Exception('File verification failed after upload');
                        }
                    }

                    $imageUrl = '/storage/' . $path;
                    
                    $uploadInfo = [
                        'original_name' => $originalName,
                        'stored_name' => $fileName,
                        'size' => $originalSize,
                        'size_formatted' => $this->formatBytes($originalSize),
                        'mime_type' => $mimeType,
                        'extension' => $extension,
                        'url' => $imageUrl,
                        'path' => $path,
                        'uploaded_at' => now()->toISOString()
                    ];

                } catch (\Exception $uploadException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Image upload failed',
                        'error' => $uploadException->getMessage()
                    ], 500);
                }
            }

            // Create hero image record
            $heroImage = HeroImage::create([
                'title' => $request->title,
                'subtitle' => $request->subtitle,
                'image_url' => $imageUrl,
                'is_active' => $request->boolean('is_active', true),
                'sort_order' => $request->integer('sort_order', 0)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Hero image created successfully',
                'data' => $heroImage,
                'upload_info' => $uploadInfo
            ], 201);

        } catch (\Exception $e) {
            // Clean up uploaded file if creation fails
            if (isset($path) && $path) {
                Storage::disk('public')->delete($path);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to create hero image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified hero image
     */
    public function show(string $id): JsonResponse
    {
        try {
            // Check admin authorization
            if (!Auth::user() || Auth::user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $heroImage = HeroImage::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $heroImage
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Hero image not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch hero image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified hero image
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            // Check admin authorization
            if (!Auth::user() || Auth::user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $heroImage = HeroImage::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'subtitle' => 'sometimes|required|string|max:1000', 
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'is_active' => 'boolean',
                'sort_order' => 'integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only(['title', 'subtitle', 'is_active', 'sort_order']);
            $uploadInfo = null;

            // Handle image update if provided
            if ($request->hasFile('image')) {
                // Delete old image
                if ($heroImage->image_url && str_starts_with($heroImage->image_url, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $heroImage->image_url);
                    Storage::disk('public')->delete($oldPath);
                }

                // Upload new image
                $imageFile = $request->file('image');
                $originalName = $imageFile->getClientOriginalName();
                $fileName = 'hero_' . time() . '_' . str_replace(' ', '_', $originalName);
                $path = $imageFile->storeAs('hero-images', $fileName, 'public');

                if ($path) {
                    $data['image_url'] = '/storage/' . $path;
                    $uploadInfo = [
                        'original_name' => $originalName,
                        'stored_name' => $fileName,
                        'size' => $imageFile->getSize(),
                        'size_formatted' => $this->formatBytes($imageFile->getSize()),
                        'uploaded_at' => now()->toISOString()
                    ];
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload new image'
                    ], 500);
                }
            }

            $heroImage->update($data);

            $response = [
                'success' => true,
                'message' => 'Hero image updated successfully',
                'data' => $heroImage->fresh()
            ];

            if ($uploadInfo) {
                $response['upload_info'] = $uploadInfo;
            }

            return response()->json($response);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Hero image not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update hero image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified hero image
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            // Check admin authorization
            if (!Auth::user() || Auth::user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $heroImage = HeroImage::findOrFail($id);

            // Delete associated image file
            if ($heroImage->image_url && str_starts_with($heroImage->image_url, '/storage/')) {
                $imagePath = str_replace('/storage/', '', $heroImage->image_url);
                Storage::disk('public')->delete($imagePath);
            }

            $heroImage->delete();

            return response()->json([
                'success' => true,
                'message' => 'Hero image deleted successfully'
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Hero image not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete hero image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active carousel slides for public display
     */
    public function carousel(): JsonResponse
    {
        try {
            $slides = HeroImage::active()->ordered()->get();
            
            return response()->json([
                'success' => true,
                'data' => $slides
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch carousel slides',
                'error' => $e->getMessage()
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
}
