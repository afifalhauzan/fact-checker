<?php

namespace App\Http\Controllers;

use App\Models\TelaahIdentifier;
use App\Models\TelaahPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Internal endpoints for the "sudah ditelaah sebelumnya" check (design doc 6.2). Laravel only
 * finds candidates; the web server scores them, so the scoring stays in one tested place.
 */
class TelaahMatchController extends Controller
{
    private const NEAREST_NEIGHBORS = 10;

    public function similar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'embedding' => ['nullable', 'array', 'size:'.TelaahPostController::EMBEDDING_DIMENSIONS],
            'embedding.*' => ['numeric'],
            'identifiers' => ['present', 'array', 'max:40'],
            'identifiers.*.kind' => ['required', Rule::in(TelaahIdentifier::KINDS)],
            'identifiers.*.value' => ['required', 'string', 'max:200'],
        ]);

        $cosines = $this->nearestByEmbedding($data['embedding'] ?? null);

        $sharedIdentifiers = [];
        if ($data['identifiers']) {
            $matches = TelaahIdentifier::query()
                ->where(function ($query) use ($data) {
                    foreach ($data['identifiers'] as $identifier) {
                        $query->orWhere(fn ($q) => $q->where('kind', $identifier['kind'])->where('value', $identifier['value']));
                    }
                })
                ->get(['post_id', 'kind', 'value']);

            foreach ($matches as $match) {
                $sharedIdentifiers[$match->post_id][] = ['kind' => $match->kind, 'value' => $match->value];
            }
        }

        $postIds = array_unique([...array_keys($cosines), ...array_keys($sharedIdentifiers)]);
        $missingCosine = array_diff(array_keys($sharedIdentifiers), array_keys($cosines));
        $cosines += $this->cosineFor($data['embedding'] ?? null, $missingCosine);

        $posts = TelaahPost::with(['attachments', 'identifiers', 'comments' => fn ($q) => $q->orderBy('id')->limit(3)])
            ->where('status', 'visible')
            ->whereIn('id', $postIds)
            ->get();

        return response()->json([
            'data' => $posts->map(fn (TelaahPost $post) => [
                'post' => [
                    ...$post->present(),
                    'comments' => $post->comments->map->present()->values(),
                ],
                'cosine' => $cosines[$post->id] ?? null,
                'sharedIdentifiers' => $sharedIdentifiers[$post->id] ?? [],
                'identifiers' => $post->identifiers->map->only(['kind', 'value'])->values(),
            ])->values(),
        ]);
    }

    /**
     * Counts that a post was offered as a match, at most once per viewer per day.
     */
    public function matched(Request $request, TelaahPost $post): JsonResponse
    {
        $data = $request->validate(['viewer_key' => ['required', 'string', 'max:100']]);

        if (Cache::add("telaah-matched:{$post->id}:{$data['viewer_key']}", true, now()->addDay())) {
            $post->increment('match_count');
        }

        return response()->json(['matchCount' => $post->fresh()->match_count]);
    }

    /**
     * Posts without an embedding (seed data, or an embedding call that failed), for the backfill script.
     */
    public function missingEmbeddings(): JsonResponse
    {
        abort_unless(DB::getDriverName() === 'pgsql', 501);

        $posts = TelaahPost::whereNull('embedding')->limit(100)->get(['id', 'title', 'summary', 'material_lines']);

        return response()->json(['data' => $posts->map->only(['id', 'title', 'summary', 'material_lines'])->values()]);
    }

    public function storeEmbedding(Request $request, TelaahPost $post): JsonResponse
    {
        $data = $request->validate([
            'embedding' => ['required', 'array', 'size:'.TelaahPostController::EMBEDDING_DIMENSIONS],
            'embedding.*' => ['numeric'],
        ]);

        TelaahPostController::saveEmbedding($post, $data['embedding']);

        return response()->json(['id' => $post->id]);
    }

    /**
     * @param  array<int, float>|null  $embedding
     * @return array<int, float> post id => cosine similarity
     */
    private function nearestByEmbedding(?array $embedding): array
    {
        if ($embedding === null || DB::getDriverName() !== 'pgsql') {
            return [];
        }

        $vector = $this->vectorLiteral($embedding);
        $rows = DB::select(
            "select id, 1 - (embedding <=> ?::vector) as cosine from telaah_posts
             where status = 'visible' and embedding is not null
             order by embedding <=> ?::vector limit ".self::NEAREST_NEIGHBORS,
            [$vector, $vector],
        );

        return collect($rows)->mapWithKeys(fn ($row) => [$row->id => (float) $row->cosine])->all();
    }

    /**
     * @param  array<int, float>|null  $embedding
     * @param  array<int, int>  $postIds
     * @return array<int, float>
     */
    private function cosineFor(?array $embedding, array $postIds): array
    {
        if ($embedding === null || ! $postIds || DB::getDriverName() !== 'pgsql') {
            return [];
        }

        $rows = DB::table('telaah_posts')
            ->whereIn('id', $postIds)
            ->whereNotNull('embedding')
            ->selectRaw('id, 1 - (embedding <=> ?::vector) as cosine', [$this->vectorLiteral($embedding)])
            ->get();

        return $rows->mapWithKeys(fn ($row) => [$row->id => (float) $row->cosine])->all();
    }

    /**
     * @param  array<int, float>  $embedding
     */
    private function vectorLiteral(array $embedding): string
    {
        return '['.implode(',', array_map('floatval', $embedding)).']';
    }
}
