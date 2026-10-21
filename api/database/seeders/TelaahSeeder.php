<?php

namespace Database\Seeders;

use App\Http\Controllers\TelaahPostController;
use App\Models\TelaahPost;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Fictitious TelaahBareng posts for the local matching check (web: pnpm eval:similar) only.
 * Not run by DatabaseSeeder and never in production: the app starts empty and is filled by its
 * testers. Every company, number, account, and domain in data/telaah-seed.json is fictitious, and
 * the JSON carries each post's embedding (Gemini, 768 dimensions).
 *
 *   php artisan db:seed --class=TelaahSeeder        (local database only)
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
