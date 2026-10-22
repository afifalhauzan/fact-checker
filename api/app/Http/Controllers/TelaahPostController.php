<?php

namespace App\Http\Controllers;

use App\Models\TelaahAttachment;
use App\Models\TelaahComment;
use App\Models\TelaahIdentifier;
use App\Models\TelaahPost;
use App\Models\TelaahReaction;
use App\Models\TelaahReport;
use App\Models\User;
use App\Support\ImageMetadata;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TelaahPostController extends Controller
{
    private const PAGE_SIZE = 20;

    /**
     * Public list with the filters of the TelaahBareng page. `mine` lists the viewer's own posts,
     * hidden ones included.
     */
    public function index(Request $request): JsonResponse
    {
        $viewer = $request->user('sanctum');
        $filters = $request->validate([
            'sort' => ['nullable', Rule::in(['ramai', 'terbaru'])],
            'risk' => ['nullable', Rule::in(TelaahPost::RISK_LEVELS)],
            'modus' => ['nullable', Rule::in(TelaahPost::MODUS)],
            'q' => ['nullable', 'string', 'max:100'],
            'year' => ['nullable', 'integer', 'between:2000,2100'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'mine' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'between:1,50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = TelaahPost::query()->with('attachments');

        if ($request->boolean('mine')) {
            abort_unless($viewer, 401);
            $query->where('user_id', $viewer->id);
        } else {
            $query->where('status', 'visible');
        }

        $query
            ->when($filters['risk'] ?? null, fn (Builder $q, $risk) => $q->where('risk_level', $risk))
            ->when($filters['modus'] ?? null, fn (Builder $q, $modus) => $q->where('modus', $modus))
            ->when($filters['year'] ?? null, fn (Builder $q, $year) => $q->whereYear('created_at', $year))
            ->when($filters['from'] ?? null, fn (Builder $q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn (Builder $q, $to) => $q->whereDate('created_at', '<=', $to))
            ->when($filters['q'] ?? null, fn (Builder $q, $search) => $this->applySearch($q, $search));

        if (($filters['sort'] ?? 'ramai') === 'ramai' && DB::getDriverName() === 'pgsql') {
            // hot_score from design doc 6.8, computed at read time so quiet posts keep sinking
            $query->orderByRaw(
                '(2 * reaction_count + comment_count + match_count) / power(extract(epoch from (now() - created_at)) / 3600 + 2, 1.5) desc'
            );
        }
        $query->orderByDesc('created_at')->orderByDesc('id');

        $page = $query->simplePaginate($filters['limit'] ?? self::PAGE_SIZE);
        $posts = collect($page->items());
        $state = $this->viewerState($viewer, $posts->pluck('id')->all());

        return response()->json([
            'data' => $posts->map(fn (TelaahPost $post) => $post->present($state($post)))->values(),
            'hasMore' => $page->hasMorePages(),
        ]);
    }

    public function show(Request $request, TelaahPost $post): JsonResponse
    {
        $viewer = $request->user('sanctum');
        $isOwner = $viewer && $post->user_id === $viewer->id;

        // Hidden after a confirmed personal-data report: only the owner can still open it to edit
        abort_if($post->status !== 'visible' && ! $isOwner, 404);

        $post->load(['attachments', 'comments' => fn ($q) => $q->with('user')->orderBy('id')]);
        $state = $this->viewerState($viewer, [$post->id]);

        return response()->json([
            ...$post->present($state($post)),
            'comments' => $post->comments->map(fn (TelaahComment $comment) => $comment->present($post->user_id, $viewer?->id))->values(),
        ]);
    }

    /**
     * Publishes a post. The web server has already verified the signed analysis payload, so the
     * verdict, evidence, and material here are the analyzed ones minus what the user removed.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = Validator::make(json_decode((string) $request->input('post'), true) ?? [], [
            ...$this->contentRules(),
            'risk_level' => ['required', Rule::in(TelaahPost::RISK_LEVELS)],
            'claim' => ['required', 'string', 'max:2000'],
            'summary' => ['required', 'string', 'max:3000'],
            'modus' => ['required', Rule::in(TelaahPost::MODUS)],
            'evidence' => ['present', 'array', 'max:10'],
            'evidence.*.type' => ['required', 'string', 'max:40'],
            'evidence.*.description' => ['required', 'string', 'max:1000'],
            'evidence.*.evidence' => ['nullable', 'string', 'max:1000'],
            'contacts' => ['present', 'array', 'max:20'],
            'contacts.*.kind' => ['required', Rule::in(TelaahIdentifier::KINDS)],
            'contacts.*.value' => ['required', 'string', 'max:200'],
            'identifiers' => ['present', 'array', 'max:40'],
            'identifiers.*.kind' => ['required', Rule::in(TelaahIdentifier::KINDS)],
            'identifiers.*.value' => ['required', 'string', 'max:200'],
            'company' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'salary' => ['nullable', 'string', 'max:255'],
            'open_date' => ['nullable', 'date'],
            'close_date' => ['nullable', 'date'],
            'source_platform' => ['nullable', 'string', 'max:40'],
            'source_account' => ['nullable', 'string', 'max:255'],
            'analyzed_at' => ['required', 'date'],
            'share_key' => ['required', 'regex:/^[0-9a-f]{64}$/'],
            'attachments' => ['present', 'array', 'max:4'],
            'attachments.*.label' => ['required', 'string', 'max:120'],
            'attachments.*.sha256' => ['required', 'regex:/^[0-9a-f]{64}$/'],
        ])->validate();

        // The unique index also catches two submits racing each other
        abort_if(TelaahPost::where('share_key', $data['share_key'])->exists(), 409, 'Hasil telaah ini sudah pernah diposting.');

        $request->validate([
            'files' => [$data['attachments'] ? 'required' : 'nullable', 'array', 'size:'.count($data['attachments'])],
            'files.*' => ['file', 'max:7168', 'mimetypes:'.implode(',', ImageMetadata::MIMES)],
        ]);
        $files = array_values($request->file('files', []));
        $cleaned = $this->stripMetadata($files);

        $post = DB::transaction(function () use ($user, $data, $files, $cleaned) {
            $post = TelaahPost::create([
                ...collect($data)->except(['identifiers', 'attachments'])->all(),
                'user_id' => $user->id,
                'author_pseudonym' => $user->pseudonym,
                'status' => 'visible',
                'is_seed' => false,
            ]);
            $post->identifiers()->createMany($this->uniqueIdentifiers($data['identifiers']));

            foreach ($files as $index => $file) {
                $path = "telaah/{$post->id}/".Str::random(32).'.'.$file->extension();
                Storage::disk('local')->put($path, $cleaned[$index]);
                $post->attachments()->create([
                    'path' => $path,
                    'label' => $data['attachments'][$index]['label'],
                    'mime' => $file->getMimeType(),
                    'size' => strlen($cleaned[$index]),
                    'sha256' => $data['attachments'][$index]['sha256'],
                ]);
            }

            return $post;
        });

        return response()->json($post->load('attachments')->present(['isOwner' => true]), 201);
    }

    /**
     * Owner edits (design doc 5.2): title and story are free text; material, links, and
     * attachments can only be removed.
     */
    public function update(Request $request, TelaahPost $post): JsonResponse
    {
        abort_unless($post->user_id === $request->user()->id, 404);

        $data = $request->validate([
            ...$this->contentRules(),
            'attachment_ids' => ['present', 'array'],
            'attachment_ids.*' => ['integer'],
            // Set by the web server's redaction scan; a hidden post becomes visible once it is clean
            'still_sensitive' => ['required', 'boolean'],
        ]);

        abort_unless($this->isSubsequence($data['material_lines'], $post->material_lines), 422, 'Materi hanya boleh dikurangi.');
        abort_unless(empty(array_diff($data['links'], $post->links)), 422, 'Link hanya boleh dikurangi.');

        $removed = $post->attachments()->whereNotIn('id', $data['attachment_ids'])->get();
        Storage::disk('local')->delete($removed->pluck('path')->all());
        $post->attachments()->whereIn('id', $removed->pluck('id'))->delete();

        $post->fill(collect($data)->only(['title', 'story', 'material_lines', 'links'])->all());
        if ($post->status === 'hidden_pending_edit' && ! $data['still_sensitive']) {
            $post->status = 'visible';
        }
        $post->save();

        return response()->json($post->load('attachments')->present(['isOwner' => true]));
    }

    /**
     * The post published from a given analysis, if any; deleting the post frees the analysis again.
     */
    public function findShared(string $shareKey): JsonResponse
    {
        $post = TelaahPost::where('share_key', $shareKey)->first(['id', 'status']);

        abort_unless($post, 404);

        return response()->json(['id' => $post->id, 'status' => $post->status]);
    }

    public function destroy(Request $request, TelaahPost $post): JsonResponse
    {
        abort_unless($post->user_id === $request->user()->id, 404);

        Storage::disk('local')->deleteDirectory("telaah/{$post->id}");
        $post->delete();

        return response()->json(['message' => 'Telaah deleted']);
    }

    public function attachment(Request $request, TelaahAttachment $attachment): StreamedResponse
    {
        $post = $attachment->post;
        $viewer = $request->user('sanctum');
        abort_if($post->status !== 'visible' && ! ($viewer && $post->user_id === $viewer->id), 404);

        return Storage::disk('local')->response($attachment->path, $attachment->label, [
            'Content-Type' => $attachment->mime,
            'Cache-Control' => 'private, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function contentRules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'story' => ['nullable', 'string', 'max:1500'],
            'material_lines' => ['required', 'array', 'min:1', 'max:200'],
            'material_lines.*' => ['string', 'max:1000'],
            'links' => ['present', 'array', 'max:20'],
            'links.*' => ['string', 'max:500'],
        ];
    }

    /**
     * Each word must appear somewhere; numbers also match normalized contacts, so "0812 0000"
     * finds a post that lists "+62 812-0000-...".
     */
    private function applySearch(Builder $query, string $search): void
    {
        // A phone number typed with spaces ("+62 812 0000 4471") is one word, not four
        $search = preg_replace_callback(
            '/(?:\+?62|0)[\s.-]?8(?:[\s.-]?\d){6,11}/',
            fn (array $match) => preg_replace('/\D/', '', $match[0]),
            $search,
        );
        $words = preg_split('/\s+/', mb_strtolower(trim($search)), -1, PREG_SPLIT_NO_EMPTY);

        foreach ($words as $word) {
            $like = '%'.addcslashes($word, '%_\\').'%';
            $digits = preg_replace('/\D/', '', $word);
            $phone = preg_replace('/^0(8)/', '62$1', $digits);

            $query->where(function (Builder $match) use ($like, $digits, $phone) {
                foreach (['title', 'summary', 'company', 'position', 'location', 'source_platform', 'source_account'] as $column) {
                    $match->orWhereRaw("lower({$column}) like ?", [$like]);
                }
                $match->orWhereHas('identifiers', function (Builder $identifier) use ($like, $digits, $phone) {
                    $identifier->where('value', 'like', $like);
                    if (strlen($digits) >= 4) {
                        $identifier->orWhere('value', 'like', '%'.$phone.'%');
                    }
                });
            });
        }
    }

    /**
     * @param  array<int, int>  $postIds
     * @return callable(TelaahPost): array{isOwner: bool, reacted: bool, reported: bool}
     */
    private function viewerState(?User $viewer, array $postIds): callable
    {
        $reacted = $viewer ? TelaahReaction::where('user_id', $viewer->id)->whereIn('post_id', $postIds)->pluck('post_id')->all() : [];
        $reported = $viewer ? TelaahReport::where('user_id', $viewer->id)->whereIn('post_id', $postIds)->pluck('post_id')->all() : [];

        return fn (TelaahPost $post) => [
            'isOwner' => $viewer !== null && $post->user_id === $viewer->id,
            'reacted' => in_array($post->id, $reacted, true),
            'reported' => in_array($post->id, $reported, true),
        ];
    }

    /**
     * @param  array<int, UploadedFile>  $files
     * @return array<int, string>
     */
    private function stripMetadata(array $files): array
    {
        try {
            return array_map(fn (UploadedFile $file) => ImageMetadata::strip($file->get(), (string) $file->getMimeType()), $files);
        } catch (InvalidArgumentException) {
            abort(422, 'Lampiran tidak bisa dibaca sebagai gambar.');
        }
    }

    /**
     * @param  array<int, array{kind: string, value: string}>  $identifiers
     * @return array<int, array{kind: string, value: string}>
     */
    private function uniqueIdentifiers(array $identifiers): array
    {
        return collect($identifiers)->unique(fn ($item) => $item['kind'].'|'.$item['value'])->values()->all();
    }

    /**
     * @param  array<int, string>  $kept
     * @param  array<int, string>  $original
     */
    private function isSubsequence(array $kept, array $original): bool
    {
        $index = 0;
        foreach ($original as $line) {
            if ($index < count($kept) && $kept[$index] === $line) {
                $index++;
            }
        }

        return $index === count($kept);
    }
}
