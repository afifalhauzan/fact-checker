<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['path', 'label', 'mime', 'size', 'sha256'])]
#[Hidden(['path', 'sha256', 'post'])]
class TelaahAttachment extends Model
{
    public function post(): BelongsTo
    {
        return $this->belongsTo(TelaahPost::class, 'post_id');
    }
}
