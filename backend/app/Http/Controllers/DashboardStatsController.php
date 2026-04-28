<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Jurusan;

class DashboardStatsController extends Controller
{
    /**
     * Get dashboard statistics for student submission status
     * Grouped by Jurusan and Kelas with access control
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Access Control: Block siswa role
        if ($user->role === 'siswa') {
            abort(403, 'Access denied');
        }
        
        // Query Strategy: Optimized eager loading
        $query = Jurusan::with([
            'kelas' => function ($query) {
                $query->with([
                    'users' => function ($query) {
                        $query->where('role', 'siswa')
                              ->where('is_active', true)
                              ->with('proyeks')
                              ->select('id', 'name', 'nis', 'kelas_id', 'jurusan_id', 'role', 'is_active');
                    }
                ])->select('id', 'nama_kelas', 'jurusan_id', 'tingkat');
            }
        ])->select('id', 'nama', 'singkatan');
        
        // Filter by jurusan_id for guru role
        if ($user->role === 'guru') {
            $guruJurusanIds = $user->getJurusanIds();
            
            if (empty($guruJurusanIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Guru belum memiliki jurusan yang ditetapkan',
                    'data' => []
                ], 400);
            }
            
            $query->whereIn('id', $guruJurusanIds);
        }
        
        $jurusans = $query->get();
        
        // Data Transformation
        $data = $jurusans->map(function ($jurusan) {
            // Get all students from all classes in this jurusan
            $allStudents = $jurusan->kelas->flatMap(function ($kelas) {
                return $kelas->users;
            });
            
            // Categorize students by submission status (both 'terkirim' and 'dinilai' projects count)
            $submittedStudents = $allStudents->filter(function ($student) {
                return $student->proyeks->whereIn('status', ['terkirim', 'dinilai'])->isNotEmpty();
            });
            
            $pendingStudents = $allStudents->filter(function ($student) {
                return $student->proyeks->whereIn('status', ['terkirim', 'dinilai'])->isEmpty();
            });
            
            return [
                'jurusan_nama' => $jurusan->nama,
                'jurusan_singkatan' => $jurusan->singkatan,
                'total_siswa' => $allStudents->count(),
                'total_submitted' => $submittedStudents->count(),
                'total_pending' => $pendingStudents->count(),
                'percentage_submitted' => $allStudents->count() > 0 
                    ? round(($submittedStudents->count() / $allStudents->count()) * 100, 1)
                    : 0,
                'kelas' => $jurusan->kelas->map(function ($kelas) {
                    $kelasStudents = $kelas->users;
                    
                    $kelasSubmitted = $kelasStudents->filter(function ($student) {
                        return $student->proyeks->whereIn('status', ['terkirim', 'dinilai'])->isNotEmpty();
                    });
                    
                    $kelasPending = $kelasStudents->filter(function ($student) {
                        return $student->proyeks->whereIn('status', ['terkirim', 'dinilai'])->isEmpty();
                    });
                    
                    return [
                        'nama_kelas' => $kelas->nama_kelas,
                        'tingkat' => $kelas->tingkat,
                        'total_siswa' => $kelasStudents->count(),
                        'submitted_count' => $kelasSubmitted->count(),
                        'pending_count' => $kelasPending->count(),
                        'percentage_submitted' => $kelasStudents->count() > 0 
                            ? round(($kelasSubmitted->count() / $kelasStudents->count()) * 100, 1)
                            : 0,
                        'students_submitted' => $kelasSubmitted->map(function ($student) {
                            // Get submitted and graded projects (status 'terkirim' or 'dinilai')
                            $submittedProjects = $student->proyeks->whereIn('status', ['terkirim', 'dinilai']);
                            
                            return [
                                'id' => $student->id,
                                'name' => $student->name,
                                'nis' => $student->nis ?? $student->nis_nip,
                                'total_karya' => $submittedProjects->count(),
                                'projects' => $submittedProjects->map(function ($project) {
                                    return [
                                        'id' => $project->id,
                                        'judul' => $project->judul,
                                        'date' => $project->created_at->format('d M'),
                                        'status' => $project->status
                                    ];
                                })->values()
                            ];
                        })->values(),
                        'students_pending' => $kelasPending->map(function ($student) {
                            return [
                                'id' => $student->id,
                                'name' => $student->name,
                                'nis' => $student->nis ?? $student->nis_nip
                            ];
                        })->values()
                    ];
                })->sortBy('tingkat')->values()
            ];
        })->values();
        
        // Summary statistics
        $summary = [
            'total_jurusans' => $jurusans->count(),
            'total_kelas' => $jurusans->sum(function ($jurusan) {
                return $jurusan->kelas->count();
            }),
            'grand_total_siswa' => $data->sum('total_siswa'),
            'grand_total_submitted' => $data->sum('total_submitted'),
            'grand_total_pending' => $data->sum('total_pending'),
            'grand_percentage_submitted' => $data->sum('total_siswa') > 0 
                ? round(($data->sum('total_submitted') / $data->sum('total_siswa')) * 100, 1)
                : 0
        ];
        
        // Get filtered jurusan names for guru
        $filteredByJurusan = null;
        if ($user->role === 'guru') {
            $guruJurusans = $user->jurusans;
            if ($guruJurusans->count() > 1) {
                $filteredByJurusan = $guruJurusans->pluck('nama')->join(', ');
            } elseif ($guruJurusans->count() === 1) {
                $filteredByJurusan = $guruJurusans->first()->nama;
            } else {
                $filteredByJurusan = 'Unknown';
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Dashboard statistics retrieved successfully',
            'data' => $data,
            'summary' => $summary,
            'user_role' => $user->role,
            'filtered_by_jurusan' => $filteredByJurusan
        ]);
    }
    
    /**
     * Get detailed stats for a specific jurusan (optional endpoint)
     */
    public function jurusanStats(Request $request, $jurusanId)
    {
        $user = $request->user();
        
        if ($user->role === 'siswa') {
            abort(403, 'Access denied');
        }
        
        if ($user->role === 'guru') {
            $guruJurusanIds = $user->getJurusanIds();
            if (!in_array((int)$jurusanId, $guruJurusanIds)) {
                abort(403, 'You can only view statistics for your assigned jurusans');
            }
        }
        
        $jurusan = Jurusan::with([
            'kelas.users' => function ($query) {
                $query->where('role', 'siswa')
                      ->where('is_active', true)
                      ->with('proyeks');
            }
        ])->findOrFail($jurusanId);
        
        // Transform data similar to index method but for single jurusan
        $allStudents = $jurusan->kelas->flatMap(function ($kelas) {
            return $kelas->users;
        });
        
        $submittedStudents = $allStudents->filter(function ($student) {
            return $student->proyeks->isNotEmpty();
        });
        
        $data = [
            'jurusan_nama' => $jurusan->nama,
            'jurusan_singkatan' => $jurusan->singkatan,
            'total_siswa' => $allStudents->count(),
            'total_submitted' => $submittedStudents->count(),
            'total_pending' => $allStudents->count() - $submittedStudents->count(),
            'kelas_details' => $jurusan->kelas->map(function ($kelas) {
                $kelasStudents = $kelas->users;
                $kelasSubmitted = $kelasStudents->filter(function ($student) {
                    return $student->proyeks->isNotEmpty();
                });
                
                return [
                    'nama_kelas' => $kelas->nama_kelas,
                    'tingkat' => $kelas->tingkat,
                    'submitted_count' => $kelasSubmitted->count(),
                    'pending_count' => $kelasStudents->count() - $kelasSubmitted->count(),
                    'students' => $kelasStudents->map(function ($student) {
                        return [
                            'name' => $student->name,
                            'nis' => $student->nis ?? $student->nis_nip,
                            'has_submitted' => $student->proyeks->isNotEmpty(),
                            'proyeks_count' => $student->proyeks->count()
                        ];
                    })->sortBy('name')->values()
                ];
            })->sortBy('tingkat')->values()
        ];
        
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}