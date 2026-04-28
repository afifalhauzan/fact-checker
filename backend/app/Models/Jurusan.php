<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Jurusan extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'singkatan',
    ];

    /**
     * Get the users (siswa) that belong to this jurusan
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the kelas that belong to this jurusan
     */
    public function kelas()
    {
        return $this->hasMany(Kelas::class);
    }

    /**
     * Get the proyeks that belong to this jurusan
     */
    public function proyeks()
    {
        return $this->hasMany(Proyek::class);
    }

    /**
     * Get only siswa users for this jurusan
     */
    public function siswa()
    {
        return $this->hasMany(User::class)->where('role', 'siswa');
    }

    /**
     * Get the gurus (teachers) that can teach this jurusan (many-to-many)
     */
    public function gurus()
    {
        return $this->belongsToMany(User::class, 'guru_jurusan')->where('role', 'guru');
    }
}
