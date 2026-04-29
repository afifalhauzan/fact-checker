<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Penilaian;
use App\Models\Proyek;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PenilaianController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Only allow guru to see their penilaians
        if ($user->role !== 'guru') {
            return response()->json([
                'success' => false,
                'message' => 'Only teachers can access grading data'
            ], 403);
        }

        $penilaians = Penilaian::with(['proyek.user.kelas', 'proyek.jurusan', 'guru'])
            ->where('guru_id', $user->id)
            ->get();
            
        // Filter penilaians based on guru's assigned jurusans if not admin
        if ($user->role === 'guru') {
            $guruJurusanIds = $user->getJurusanIds();
            $penilaians = $penilaians->filter(function ($penilaian) use ($guruJurusanIds) {
                return in_array($penilaian->proyek->jurusan_id, $guruJurusanIds);
            })->values();
        }

        return response()->json([
            'success' => true,
            'data' => $penilaians
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check if user is a teacher or admin
        if ($user->role !== 'guru' && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only teachers and admins can grade projects'
            ], 403);
        }

        $validated = $request->validate([
            'proyek_id' => 'required|exists:proyeks,id',
            'bintang' => 'required|integer|min:1|max:5',
            'catatan' => 'nullable|string|max:1000'
        ]);

        // Get the project and check jurusan
        $proyek = Proyek::with('jurusan')->findOrFail($validated['proyek_id']);
        
        // Check if teacher's jurusan matches project's jurusan (admin can override)
        if ($user->role === 'guru') {
            $canTeachThisJurusan = $user->canTeachInJurusan($proyek->jurusan_id);
            if (!$canTeachThisJurusan) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only grade projects from your assigned departments'
                ], 403);
            }
        }

        // Check if already graded (admin can override)
        $existingPenilaian = Penilaian::where('proyek_id', $validated['proyek_id'])->first();
        if ($existingPenilaian && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'This project has already been graded'
            ], 409);
        }

        // If admin is overriding, delete existing grading first
        if ($existingPenilaian && $user->role === 'admin') {
            $existingPenilaian->delete();
        }

        // Create penilaian
        $penilaian = Penilaian::create([
            'proyek_id' => $validated['proyek_id'],
            'guru_id' => $user->id,
            'bintang' => $validated['bintang'],
            'catatan' => $validated['catatan']
        ]);

        // Update project status to 'dinilai'
        $proyek->update(['status' => 'dinilai']);

        // Load relationships
        $penilaian->load(['proyek.user', 'guru']);

        return response()->json([
            'success' => true,
            'message' => 'Project graded successfully',
            'data' => $penilaian
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $penilaian = Penilaian::with(['proyek.user.kelas', 'guru'])->findOrFail($id);
        $user = Auth::user();

        // Check permissions: only the grader, project owner, or admin can view
        if ($user->role !== 'admin' && 
            $user->id !== $penilaian->guru_id && 
            $user->id !== $penilaian->proyek->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view this grading'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $penilaian
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $penilaian = Penilaian::with('proyek')->findOrFail($id);

        // Check if user is the original grader or admin
        if ($user->role !== 'admin' && $user->id !== $penilaian->guru_id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update your own gradings'
            ], 403);
        }

        // Check if teacher's jurusan still matches project's jurusan (admin can override)
        if ($user->role === 'guru') {
            $canTeachThisJurusan = $user->canTeachInJurusan($penilaian->proyek->jurusan_id);
            if (!$canTeachThisJurusan) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only grade projects from your assigned departments'
                ], 403);
            }
        }

        $validated = $request->validate([
            'bintang' => 'required|integer|min:1|max:5',
            'catatan' => 'nullable|string|max:1000'
        ]);

        $penilaian->update($validated);
        $penilaian->load(['proyek.user', 'guru']);

        return response()->json([
            'success' => true,
            'message' => 'Grading updated successfully',
            'data' => $penilaian
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $penilaian = Penilaian::with('proyek')->findOrFail($id);

        // Only admin or the original grader can delete
        if ($user->role !== 'admin' && $user->id !== $penilaian->guru_id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own gradings'
            ], 403);
        }

        // Update project status back to 'terkirim'
        $penilaian->proyek->update(['status' => 'terkirim']);
        
        $penilaian->delete();

        return response()->json([
            'success' => true,
            'message' => 'Grading deleted successfully'
        ]);
    }

    /**
     * Check if user can grade a specific project
     */
    public function checkGradingPermission(Request $request)
    {
        $user = Auth::user();
        $proyekId = $request->input('proyek_id');

        if ($user->role !== 'guru' && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'can_grade' => false,
                'message' => 'Only teachers and admins can grade projects'
            ]);
        }

        $proyek = Proyek::with('jurusan')->findOrFail($proyekId);
        $sameJurusan = $user->role === 'admin' ? true : $user->canTeachInJurusan($proyek->jurusan_id);
        $alreadyGraded = Penilaian::where('proyek_id', $proyekId)->exists();
        $existingPenilaian = Penilaian::where('proyek_id', $proyekId)->first();
        
        // Admin can always grade, teachers only from same jurusan
        $canGrade = $user->role === 'admin' || ($sameJurusan && !$alreadyGraded);
        
        // Admin can override existing gradings
        if ($user->role === 'admin' && $alreadyGraded) {
            $canGrade = true;
        }

        return response()->json([
            'success' => true,
            'can_grade' => $canGrade,
            'same_jurusan' => $sameJurusan,
            'already_graded' => $alreadyGraded,
            'is_admin' => $user->role === 'admin',
            'can_override' => $user->role === 'admin' && $alreadyGraded,
            'existing_grader' => $existingPenilaian ? $existingPenilaian->guru->name : null,
            'message' => $user->role === 'admin' 
                ? ($alreadyGraded ? 'You can override the existing grading' : 'You can grade this project')
                : ($sameJurusan 
                    ? ($alreadyGraded ? 'Project already graded' : 'You can grade this project')
                    : 'You can only grade projects from your assigned departments')
        ]);
    }
}
