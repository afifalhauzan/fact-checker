<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Penilaian extends Model
{
    use HasFactory;

    protected $fillable = [
        'proyek_id',
        'guru_id',
        'nilai',
        'bintang',
        'catatan',
    ];

    protected $casts = [
        'nilai' => 'integer',
        'bintang' => 'integer',
    ];

    protected $appends = [
        'user_name',
    ];

    /**
     * Get the user name from the related guru
     */
    public function getUserNameAttribute()
    {
        return $this->guru ? $this->guru->name : null;
    }

    /**
     * Get the proyek that this penilaian belongs to
     */
    public function proyek()
    {
        return $this->belongsTo(Proyek::class);
    }

    /**
     * Get the guru that gave this penilaian
     */
    public function guru()
    {
        return $this->belongsTo(User::class, 'guru_id');
    }

    /**
     * Scope to get penilaian by numeric score
     */
    public function scopeByScore($query, $score)
    {
        return $query->where('nilai', $score);
    }

    /**
     * Scope to get high ratings (80-100)
     */
    public function scopeHighRating($query)
    {
        return $query->where('nilai', '>=', 80);
    }

    /**
     * Scope to get low ratings (1-60)
     */
    public function scopeLowRating($query)
    {
        return $query->where('nilai', '<=', 60);
    }

    /**
     * Scope to get medium ratings (61-79)
     */
    public function scopeMediumRating($query)
    {
        return $query->whereBetween('nilai', [61, 79]);
    }
}
