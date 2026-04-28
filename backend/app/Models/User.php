<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'nis_nip',
        'role',
        'jurusan_id', // For siswa only, can be null for guru
        'kelas_id',
        'nis',
        'gender',
        'is_active',
        'is_alumni',
        'email_verified_at',
        'is_changed_password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Check if user is a guru (teacher)
     */
    public function isGuru(): bool
    {
        return $this->role === 'guru';
    }

    /**
     * Check if user is a siswa (student)
     */
    public function isSiswa(): bool
    {
        return $this->role === 'siswa';
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if guru can teach in a specific jurusan
     */
    public function canTeachInJurusan(int $jurusanId): bool
    {
        if (!$this->isGuru()) {
            return false;
        }
        
        return $this->jurusans()->where('jurusan_id', $jurusanId)->exists();
    }

    /**
     * Get all jurusan IDs that this guru can teach
     */
    public function getJurusanIds(): array
    {
        if (!$this->isGuru()) {
            return [];
        }
        
        return $this->jurusans()->pluck('jurusan_id')->toArray();
    }

    /**
     * Check if user is active (has email and password)
     */
    public function isActive(): bool
    {
        return $this->is_active && !is_null($this->email) && !is_null($this->password);
    }

    /**
     * Check if user is registered (has email)
     */
    public function isRegistered(): bool
    {
        return !is_null($this->email);
    }

    /**
     * Check if user needs to change password (for imported accounts)
     */
    public function needsPasswordChange(): bool
    {
        return $this->isGuru() && !$this->is_changed_password;
    }

    /**
     * Mark password as changed
     */
    public function markPasswordAsChanged(): void
    {
        $this->update(['is_changed_password' => true]);
    }

    /**
     * Get the jurusan that the student belongs to (for siswa only)
     * For guru, this will be null since they use many-to-many jurusans() relationship
     */
    public function jurusan()
    {
        return $this->belongsTo(Jurusan::class);
    }

    /**
     * Get the jurusans that the guru can teach (for guru - many-to-many)
     * Siswa don't use this relationship
     */
    public function jurusans()
    {
        return $this->belongsToMany(Jurusan::class, 'guru_jurusan');
    }

    /**
     * Get the kelas that the student belongs to
     */
    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    /**
     * Get the proyeks created by this user (siswa)
     */
    public function proyeks()
    {
        return $this->hasMany(Proyek::class);
    }

    /**
     * Get the penilaians given by this user (guru)
     */
    public function penilaians()
    {
        return $this->hasMany(Penilaian::class, 'guru_id');
    }

    /**
     * Scope to get only guru users
     */
    public function scopeGuru($query)
    {
        return $query->where('role', 'guru');
    }

    /**
     * Scope to get only siswa users
     */
    public function scopeSiswa($query)
    {
        return $query->where('role', 'siswa');
    }

    /**
     * Scope to get only active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only registered users (with email)
     */
    public function scopeRegistered($query)
    {
        return $query->whereNotNull('email');
    }

    /**
     * Scope to get only unregistered users (without email)
     */
    public function scopeUnregistered($query)
    {
        return $query->whereNull('email');
    }
}
