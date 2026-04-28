<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Models\Jurusan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SiswaController extends Controller
{
    /**
     * Get all jurusans
     */
    public function getJurusans(): JsonResponse
    {
        try {
            $jurusans = Jurusan::orderBy('nama')->get(['id', 'nama', 'singkatan']);

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
     * Get available students (unregistered/inactive) by kelas_id
     */
    public function getAvailableStudents(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'kelas_id' => 'required|exists:kelas,id'
            ]);

            $kelasId = $request->get('kelas_id');

            $students = User::siswa()
                ->unregistered()
                ->where('is_active', false)
                ->where('kelas_id', $kelasId)
                ->select('id', 'name', 'nis')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $students
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available students',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get kelas by jurusan ID
     */
    public function getKelasByJurusan(Request $request): JsonResponse
    {
        try {
            $jurusanId = $request->get('jurusan_id');

            if (!$jurusanId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jurusan ID is required'
                ], 400);
            }

            $kelas = Kelas::where('jurusan_id', $jurusanId)
                ->orderBy('tingkat')
                ->orderBy('nama_kelas')
                ->get(['id', 'nama_kelas', 'tingkat']);

            return response()->json([
                'success' => true,
                'data' => $kelas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch kelas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all available kelas grouped by tingkat and jurusan
     */
    public function getAllKelas(): JsonResponse
    {
        try {
            $kelas = Kelas::with('jurusan:id,nama')
                ->orderBy('tingkat')
                ->orderBy('jurusan_id')
                ->orderBy('nama_kelas')
                ->get(['id', 'nama_kelas', 'tingkat', 'jurusan_id']);

            return response()->json([
                'success' => true,
                'data' => $kelas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch all kelas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}