<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'author_pseudonym', 'status', 'title', 'story', 'risk_level', 'claim', 'summary', 'modus',
    'evidence', 'material_lines', 'links', 'contacts', 'company', 'position', 'location', 'salary',
    'open_date', 'close_date', 'source_platform', 'source_account', 'is_seed', 'analyzed_at', 'share_key',
])]
#[Hidden(['user_id', 'embedding', 'share_key'])]
class TelaahPost extends Model
{
    public const RISK_LEVELS = ['sedang', 'tinggi'];

    public const MODUS = ['biaya', 'tugas_deposit', 'data_sensitif', 'tppo', 'impersonasi', 'lainnya'];

    protected function casts(): array
    {
        return [
            'evidence' => 'array',
            'material_lines' => 'array',
            'links' => 'array',
            'contacts' => 'array',
            'open_date' => 'date:Y-m-d',
            'close_date' => 'date:Y-m-d',
            'is_seed' => 'boolean',
            'analyzed_at' => 'datetime',
        ];
    }

    /**
     * The shape the web app renders. Viewer flags only mean something for a signed-in viewer.
     *
     * @param  array{isOwner?: bool, reacted?: bool, reported?: bool}  $viewer
     */
    public function present(array $viewer = []): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'title' => $this->title,
            'riskLevel' => $this->risk_level,
            'claim' => $this->claim,
            'modus' => $this->modus,
            'company' => $this->company,
            'position' => $this->position,
            'location' => $this->location,
            'salary' => $this->salary,
            'openDate' => $this->open_date?->format('Y-m-d'),
            'closeDate' => $this->close_date?->format('Y-m-d'),
            'source' => ['platform' => $this->source_platform, 'account' => $this->source_account],
            'contacts' => $this->contacts,
            'summary' => $this->summary,
            'evidence' => $this->evidence,
            'materialLines' => $this->material_lines,
            'story' => $this->story,
            'links' => $this->links,
            'attachments' => $this->attachments->map(fn (TelaahAttachment $attachment) => [
                'id' => $attachment->id,
                'label' => $attachment->label,
            ])->values(),
            'author' => $this->author_pseudonym,
            'createdAt' => $this->created_at?->toIso8601String(),
            'analyzedAt' => $this->analyzed_at?->toIso8601String(),
            'reactionCount' => $this->reaction_count,
            'commentCount' => $this->comment_count,
            'matchCount' => $this->match_count,
            'spamReports' => $this->spam_count,
            'isSeed' => $this->is_seed,
            'viewer' => [
                'isOwner' => $viewer['isOwner'] ?? false,
                'reacted' => $viewer['reacted'] ?? false,
                'reported' => $viewer['reported'] ?? false,
            ],
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function identifiers(): HasMany
    {
        return $this->hasMany(TelaahIdentifier::class, 'post_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TelaahAttachment::class, 'post_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TelaahComment::class, 'post_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(TelaahReaction::class, 'post_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(TelaahReport::class, 'post_id');
    }
}
