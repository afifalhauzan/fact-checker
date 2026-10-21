<?php

namespace Database\Seeders;

use App\Http\Controllers\TelaahPostController;
use App\Models\TelaahPost;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Example TelaahBareng posts for the demo, shown with a "Contoh awal" badge (design doc 7.5).
 * Every company, number, account, and domain in data/telaah-seed.json is fictitious.
 * The JSON carries each post's embedding (Gemini, 768 dimensions), so production needs no extra
 * step; regenerate them with pnpm telaah:embed if the embedding model changes.
 *
 *   php artisan db:seed --class=TelaahSeeder
 */
class TelaahSeeder extends Seeder
{
    public function run(): void
    {
        if (TelaahPost::where('is_seed', true)->exists()) {
            $this->command?->info('Seed posts already exist, skipping.');

            return;
        }

        $posts = json_decode(file_get_contents(__DIR__.'/data/telaah-seed.json'), true, flags: JSON_THROW_ON_ERROR);

        DB::transaction(function () use ($posts) {
            foreach ($posts as $data) {
                $post = TelaahPost::forceCreate([
                    ...collect($data)->except(['identifiers', 'comments', 'embedding'])->all(),
                    'status' => 'visible',
                    'is_seed' => true,
                    'comment_count' => count($data['comments']),
                    'updated_at' => $data['created_at'],
                ]);
                $post->identifiers()->createMany($data['identifiers']);
                TelaahPostController::saveEmbedding($post, $data['embedding'] ?? null);

                foreach ($data['comments'] as $comment) {
                    $post->comments()->forceCreate([...$comment, 'post_id' => $post->id, 'updated_at' => $comment['created_at']]);
                }
            }
        });
    }
}
