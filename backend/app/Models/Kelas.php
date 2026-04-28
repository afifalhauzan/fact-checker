<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'jurusan_id',
        'nama_kelas',
        'tingkat',
    ];

    /**
     * Get the jurusan that owns the kelas.
     */
    public function jurusan()
    {
        return $this->belongsTo(Jurusan::class);
    }

    /**
     * Get the users for the kelas.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'kelas_id');
    }

    /**
     * Get the students for the kelas.
     */
    public function students()
    {
        return $this->hasMany(User::class, 'kelas_id')->where('role', 'siswa');
    }

    /**
     * Scope to get kelas by tingkat
     */
    public function scopeByTingkat($query, $tingkat)
    {
        return $query->where('tingkat', $tingkat);
    }

    /**
     * Scope to get kelas by jurusan
     */
    public function scopeByJurusan($query, $jurusanId)
    {
        return $query->where('jurusan_id', $jurusanId);
    }
}
