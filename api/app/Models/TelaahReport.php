<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'type'])]
class TelaahReport extends Model
{
    public const TYPES = ['data_pribadi', 'spam'];
}
