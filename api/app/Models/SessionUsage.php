<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'conversation_id', 'tokens_used'])]
class SessionUsage extends Model
{
    protected function casts(): array
    {
        // Compared with === against the signed-in user's id
        return ['user_id' => 'integer', 'tokens_used' => 'integer'];
    }
}
