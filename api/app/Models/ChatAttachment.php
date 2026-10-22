<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * A file sent with a TelaahLoker message, kept as it was analyzed: private to the conversation's
 * owner, so its bytes still match the signed analysis when it is later shared to TelaahBareng
 * (where the public copy has its metadata removed).
 */
#[Fillable(['conversation_id', 'message_client_id', 'path', 'filename', 'mime', 'size', 'sha256'])]
class ChatAttachment extends Model
{
    use HasUuids;

    // The types the analysis reads; SVG is left out because a browser runs scripts inside it
    public const MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf'];

    // Same as the web app's MAX_ATTACHMENT_MB (lib/attachments.ts)
    public const MAX_KB = 7 * 1024;
}
