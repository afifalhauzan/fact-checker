<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'parent_id', 'author_pseudonym', 'body', 'flag', 'removed_at', 'hidden_at'])]
class TelaahComment extends Model
{
    protected function casts(): array
    {
        return ['removed_at' => 'datetime', 'hidden_at' => 'datetime'];
    }

    public const FLAGS = ['klaim_tanpa_bukti'];

    // Accounts younger than this get an "akun baru" badge on their comments (design doc 5.5)
    public const NEW_ACCOUNT_DAYS = 7;

    /**
     * @param  int|null  $postOwnerId  the post's author, so their comments can carry a "Pembuat" badge
     * @param  int|null  $viewerId  the signed-in viewer, who may delete their own comments
     * @param  array{liked?: int[], reported?: int[]}  $viewerActions  comment ids the viewer liked or reported
     */
    public function present(?int $postOwnerId = null, ?int $viewerId = null, array $viewerActions = []): array
    {
        $isMine = $viewerId !== null && $this->user_id === $viewerId;

        // A removed comment is only a placeholder that keeps its replies in their thread, and so is
        // one hidden for exposing personal data (its author can still delete it)
        if ($this->removed_at || $this->hidden_at) {
            return [
                'id' => $this->id,
                'parentId' => $this->parent_id,
                'isDeleted' => (bool) $this->removed_at,
                'isHidden' => ! $this->removed_at,
                'author' => null,
                'isPostAuthor' => false,
                'isMine' => $isMine && ! $this->removed_at,
                'isNewAccount' => false,
                'body' => null,
                'flag' => null,
                'likeCount' => 0,
                'spamReports' => 0,
                'viewer' => ['liked' => false, 'reported' => false],
                'createdAt' => $this->created_at?->toIso8601String(),
            ];
        }

        return [
            'isDeleted' => false,
            'isHidden' => false,
            'id' => $this->id,
            'parentId' => $this->parent_id,
            'author' => $this->author_pseudonym,
            'isPostAuthor' => $postOwnerId !== null && $this->user_id === $postOwnerId,
            'isMine' => $isMine,
            'isNewAccount' => $this->user?->created_at?->gt(now()->subDays(self::NEW_ACCOUNT_DAYS)) ?? false,
            'body' => $this->body,
            'flag' => $this->flag,
            'likeCount' => $this->like_count ?? 0,
            'spamReports' => $this->spam_count ?? 0,
            // Loose comparison: some database drivers return the ids as strings
            'viewer' => [
                'liked' => in_array($this->id, $viewerActions['liked'] ?? []),
                'reported' => in_array($this->id, $viewerActions['reported'] ?? []),
            ],
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
