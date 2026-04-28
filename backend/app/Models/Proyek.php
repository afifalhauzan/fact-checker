<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proyek extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'jurusan_id', 
        'judul',
        'deskripsi',
        'tautan_proyek',
        'image_url',
        'status',
        'is_published',
    ];

    protected $casts = [
        'status' => 'string',
        'is_published' => 'boolean',
    ];

    /**
     * Append youtube_url attribute to JSON serialization
     */
    protected $appends = ['youtube_url'];

    /**
     * Get the YouTube URL if tautan_proyek is a YouTube link
     */
    public function getYoutubeUrlAttribute()
    {
        if ($this->tautan_proyek && $this->isYouTubeUrl($this->tautan_proyek)) {
            return $this->tautan_proyek;
        }
        return null;
    }

    /**
     * Check if a URL is a YouTube URL
     */
    private function isYouTubeUrl($url)
    {
        return str_contains($url, 'youtube.com') || str_contains($url, 'youtu.be');
    }

    /**
     * Get the user (siswa) that owns the proyek
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the jurusan that the proyek belongs to
     */
    public function jurusan()
    {
        return $this->belongsTo(Jurusan::class);
    }

    /**
     * Get the penilaian for this proyek (1-to-1 relationship)
     */
    public function penilaian()
    {
        return $this->hasOne(Penilaian::class);
    }

    /**
     * Scope to get projects by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get terkirim projects
     */
    public function scopeTerkirim($query)
    {
        return $query->where('status', 'terkirim');
    }

    /**
     * Scope to get dinilai projects
     */
    public function scopeDinilai($query)
    {
        return $query->where('status', 'dinilai');
    }

    /**
     * Scope to get published projects
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
