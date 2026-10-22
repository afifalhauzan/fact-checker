<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'parent_id', 'author_pseudonym', 'body', 'flag'])]
class TelaahComment extends Model
{
    public const FLAGS = ['klaim_tanpa_bukti'];

    // Accounts younger than this get an "akun baru" badge on their comments (design doc 5.5)
    public const NEW_ACCOUNT_DAYS = 7;

    /**
     * @param  int|null  $postOwnerId  the post's author, so their comments can carry a "Pembuat" badge
     */
    public function present(?int $postOwnerId = null): array
    {
        return [
            'id' => $this->id,
            'parentId' => $this->parent_id,
            'author' => $this->author_pseudonym,
            'isPostAuthor' => $postOwnerId !== null && $this->user_id === $postOwnerId,
            'isNewAccount' => $this->user?->created_at?->gt(now()->subDays(self::NEW_ACCOUNT_DAYS)) ?? false,
            'body' => $this->body,
            'flag' => $this->flag,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
