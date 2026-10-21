<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['kind', 'value'])]
class TelaahIdentifier extends Model
{
    public const KINDS = ['phone', 'email', 'account', 'domain'];

    public $timestamps = false;
}
