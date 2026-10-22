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
            'parent_id' => ['nullable', 'integer'],
        ]);

        // Replies nest to any depth; the web app folds the deeper levels
        if (! empty($data['parent_id'])) {
            abort_unless($post->comments()->whereKey($data['parent_id'])->exists(), 422, 'Komentar yang dibalas tidak ditemukan.');
        }

        $comment = DB::transaction(function () use ($request, $post, $data) {
            $post->increment('comment_count');

            return $post->comments()->create([
                ...$data,
                'user_id' => $request->user()->id,
                'author_pseudonym' => $request->user()->pseudonym,
            ]);
        });

        return response()->json($comment->load('user')->present($post->user_id, $request->user()->id), 201);
    }

    /**
     * Only the comment's own author may delete it (the post's creator cannot silence objections).
     * A comment with replies becomes a "Komentar telah dihapus" placeholder, its text and author
     * wiped, so the replies keep their thread; anything else is deleted outright.
     */
    public function destroyComment(Request $request, TelaahPost $post, TelaahComment $comment): JsonResponse
    {
        abort_unless(
            $comment->post_id === $post->id && $comment->user_id === $request->user()->id && ! $comment->removed_at,
            404,
        );

        DB::transaction(function () use ($post, $comment) {
            if (TelaahComment::where('parent_id', $comment->id)->exists()) {
                $comment->update(['removed_at' => now(), 'body' => '', 'author_pseudonym' => '', 'user_id' => null, 'flag' => null]);
            } else {
                $parent = $comment->parent_id ? TelaahComment::find($comment->parent_id) : null;
                $comment->delete();
                // A placeholder left without replies goes too, up the chain of placeholders
                while ($parent?->removed_at && ! TelaahComment::where('parent_id', $parent->id)->exists()) {
                    $grandparent = $parent->parent_id ? TelaahComment::find($parent->parent_id) : null;
                    $parent->delete();
                    $parent = $grandparent;
                }
            }
            // comment_count counts visible comments; a placeholder was already uncounted
            $post->decrement('comment_count', min(1, $post->comment_count));
        });

        return response()->json(['message' => 'Comment deleted', 'commentCount' => $post->fresh()->comment_count]);
    }

    public function toggleReaction(Request $request, TelaahPost $post): JsonResponse
    {
        abort_unless($post->status === 'visible', 404);
        // "I received this too" only counts other people
        abort_if($post->user_id === $request->user()->id, 422, 'Kamu tidak bisa menandai Telaah milikmu sendiri.');

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

    /** A like says "this comment helped". Like the post reaction, it never touches the verdict. */
    public function toggleCommentLike(Request $request, TelaahPost $post, TelaahComment $comment): JsonResponse
    {
        $user = $request->user();
        $this->abortUnlessShown($post, $comment);
        abort_if($comment->user_id === $user->id, 422, 'Kamu tidak bisa menyukai komentarmu sendiri.');

        $liked = DB::transaction(function () use ($user, $comment) {
            $deleted = DB::table('telaah_comment_likes')->where(['comment_id' => $comment->id, 'user_id' => $user->id])->delete();
            if ($deleted) {
                $comment->decrement('like_count');

                return false;
            }

            DB::table('telaah_comment_likes')->insert(['comment_id' => $comment->id, 'user_id' => $user->id, 'created_at' => now(), 'updated_at' => now()]);
            $comment->increment('like_count');

            return true;
        });

        return response()->json(['liked' => $liked, 'likeCount' => $comment->fresh()->like_count]);
    }

    /**
     * The same rules as reporting a post (design doc 5.3): spam is only a label, and a
     * personal-data report hides the comment only when the redaction scan confirms it.
     */
    public function storeCommentReport(Request $request, TelaahPost $post, TelaahComment $comment): JsonResponse
    {
        $user = $request->user();
        $this->abortUnlessShown($post, $comment);
        abort_if($comment->user_id === $user->id, 422, 'Kamu tidak bisa melaporkan komentarmu sendiri.');

        $data = $request->validate([
            'type' => ['required', Rule::in(TelaahReport::TYPES)],
            // Result of the web server's redaction scan of the comment, for "data_pribadi" reports
            'sensitive_found' => ['required', 'boolean'],
        ]);

        $created = DB::table('telaah_comment_reports')->insertOrIgnore([
            'comment_id' => $comment->id, 'user_id' => $user->id, 'type' => $data['type'], 'created_at' => now(), 'updated_at' => now(),
        ]);
        $counts = $created && $user->created_at->lte(now()->subHours(self::MIN_REPORTER_AGE_HOURS));

        if ($counts && $data['type'] === 'spam') {
            $comment->increment('spam_count');
        }
        if ($counts && $data['type'] === 'data_pribadi' && $data['sensitive_found']) {
            $comment->update(['hidden_at' => now()]);
        }

        return response()->json(['reported' => true]);
    }

    private function abortUnlessShown(TelaahPost $post, TelaahComment $comment): void
    {
        abort_unless(
            $post->status === 'visible' && $comment->post_id === $post->id && ! $comment->removed_at && ! $comment->hidden_at,
            404,
        );
    }
}
