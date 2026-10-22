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
 * finds candidates by three rules; the web server scores them, so the scoring stays in one
 * tested place.
 */
class TelaahMatchController extends Controller
{
    private const NEAREST_TEXTS = 10;

    private const POSITION_CANDIDATES = 20;

    public function similar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'max:20000'],
            'identifiers' => ['present', 'array', 'max:40'],
            'identifiers.*.kind' => ['required', Rule::in(TelaahIdentifier::KINDS)],
            'identifiers.*.value' => ['required', 'string', 'max:200'],
        ]);
        $text = $data['text'];

        // Rule 1: a shared phone, bank account, email, or link
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

        // Rule 3 candidates: the post's position is written in the new material (company and
        // the supporting evidence are checked by the web server)
        $positionMatches = TelaahPost::query()
            ->where('status', 'visible')
            ->whereNotNull('company')
            ->whereNotNull('position')
            ->whereRaw("lower(?) like '%' || lower(position) || '%'", [$text])
            ->limit(self::POSITION_CANDIDATES)
            ->pluck('id')
            ->all();

        // Rule 2: nearly identical text (trigram similarity, Postgres only)
        $similarities = $this->nearestTexts($text);

        $postIds = array_unique([...array_keys($sharedIdentifiers), ...$positionMatches, ...array_keys($similarities)]);
        $similarities += $this->similarityFor($text, array_diff($postIds, array_keys($similarities)));

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
                'textSimilarity' => $similarities[$post->id] ?? null,
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
     * @return array<int, float> post id => trigram similarity (0-1)
     */
    private function nearestTexts(string $text): array
    {
        if (DB::getDriverName() !== 'pgsql') {
            return [];
        }

        $rows = DB::select(
            "select id, similarity(material_text, ?) as similarity from telaah_posts
             where status = 'visible' and material_text is not null
             order by material_text <-> ? limit ".self::NEAREST_TEXTS,
            [$text, $text],
        );

        return collect($rows)->mapWithKeys(fn ($row) => [$row->id => (float) $row->similarity])->all();
    }

    /**
     * @param  array<int, int>  $postIds
     * @return array<int, float>
     */
    private function similarityFor(string $text, array $postIds): array
    {
        if (! $postIds || DB::getDriverName() !== 'pgsql') {
            return [];
        }

        return DB::table('telaah_posts')
            ->whereIn('id', $postIds)
            ->selectRaw('id, similarity(material_text, ?) as similarity', [$text])
            ->get()
            ->mapWithKeys(fn ($row) => [$row->id => (float) $row->similarity])
            ->all();
    }
}
