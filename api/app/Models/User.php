<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

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

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            $user->pseudonym ??= static::newPseudonym();
        });
    }

    /**
     * A public name that does not reveal the account, e.g. "Pencari Kerja #a3f9".
     */
    public static function newPseudonym(): string
    {
        do {
            $pseudonym = 'Pencari Kerja #'.bin2hex(random_bytes(2));
        } while (static::where('pseudonym', $pseudonym)->exists());

        return $pseudonym;
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }
}
