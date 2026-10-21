<?php

namespace App\Http\Controllers;

use App\Models\TelaahComment;
use App\Models\TelaahPost;
use App\Models\TelaahReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Discussion, "Saya juga menerima ini", and reports. Comments and reactions never touch the
 * risk level: the verdict belongs to the analysis.
 */
class TelaahInteractionController extends Controller
{
    // Reports from accounts younger than this are recorded but change nothing (design doc 5.3)
    private const MIN_REPORTER_AGE_HOURS = 24;

    public function storeComment(Request $request, TelaahPost $post): JsonResponse
    {
        abort_unless($post->status === 'visible', 404);

        $data = $request->validate([
            // Redacted on the web server before it gets here
            'body' => ['required', 'string', 'max:1000'],
            'flag' => ['nullable', Rule::in(TelaahComment::FLAGS)],
        ]);

        $comment = DB::transaction(function () use ($request, $post, $data) {
            $post->increment('comment_count');

            return $post->comments()->create([
                ...$data,
                'user_id' => $request->user()->id,
                'author_pseudonym' => $request->user()->pseudonym,
            ]);
        });

        return response()->json($comment->load('user')->present(), 201);
    }

    public function toggleReaction(Request $request, TelaahPost $post): JsonResponse
    {
        abort_unless($post->status === 'visible', 404);

        $reacted = DB::transaction(function () use ($request, $post) {
            $deleted = $post->reactions()->where('user_id', $request->user()->id)->delete();
            if ($deleted) {
                $post->decrement('reaction_count');

                return false;
            }

            $post->reactions()->create(['user_id' => $request->user()->id]);
            $post->increment('reaction_count');

            return true;
        });

        return response()->json(['reacted' => $reacted, 'reactionCount' => $post->fresh()->reaction_count]);
    }

    public function storeReport(Request $request, TelaahPost $post): JsonResponse
    {
        $user = $request->user();
        abort_unless($post->status === 'visible', 404);
        abort_if($post->user_id === $user->id, 422, 'Kamu tidak bisa melaporkan Telaah milikmu sendiri.');

        $data = $request->validate([
            'type' => ['required', Rule::in(TelaahReport::TYPES)],
            // Result of the web server's redaction scan of the post, for "data_pribadi" reports
            'sensitive_found' => ['required', 'boolean'],
        ]);

        $report = $post->reports()->firstOrCreate(['user_id' => $user->id], ['type' => $data['type']]);
        $counts = $report->wasRecentlyCreated && $user->created_at->lte(now()->subHours(self::MIN_REPORTER_AGE_HOURS));

        if ($counts && $data['type'] === 'spam') {
            $post->increment('spam_count');
        }
        // A false "personal data" report must not hide a post that exposes a scammer's number,
        // so only a confirmed finding hides it, until the owner edits it.
        if ($counts && $data['type'] === 'data_pribadi' && $data['sensitive_found']) {
            $post->update(['status' => 'hidden_pending_edit']);
        }

        return response()->json(['reported' => true, 'type' => $report->type]);
    }
}
