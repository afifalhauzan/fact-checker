<?php

namespace App\Http\Controllers;

use App\Models\Jurusan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class JurusanController extends Controller
{
    /**
     * Display a listing of all jurusans
     */
    public function index(): JsonResponse
    {
        try {
            $jurusans = Jurusan::orderBy('nama')->get();

            return response()->json([
                'success' => true,
                'data' => $jurusans
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch jurusans',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified jurusan
     */
    public function show(string $id): JsonResponse
    {
        try {
            $jurusan = Jurusan::with(['users', 'proyeks'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $jurusan
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Jurusan not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }
}