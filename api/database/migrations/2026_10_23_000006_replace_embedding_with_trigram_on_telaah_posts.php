<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Similar posts are found by rules instead of embeddings: shared contacts, nearly identical text
 * (pg_trgm, which ships with stock Postgres), and same company and position with supporting
 * evidence. Databases created before this change lose their pgvector column and extension.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('telaah_posts', function (Blueprint $table) {
            // The material lines as one text, for trigram similarity
            $table->text('material_text')->nullable();
        });

        DB::table('telaah_posts')->orderBy('id')->each(function (object $post) {
            DB::table('telaah_posts')->where('id', $post->id)->update([
                'material_text' => implode("\n", json_decode($post->material_lines, true) ?? []),
            ]);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS telaah_posts_embedding_index');
            DB::statement('ALTER TABLE telaah_posts DROP COLUMN IF EXISTS embedding');
            DB::statement('DROP EXTENSION IF EXISTS vector');
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
            // GiST (not GIN) so the nearest posts can be ordered by trigram distance
            DB::statement('CREATE INDEX telaah_posts_material_trgm_index ON telaah_posts USING gist (material_text gist_trgm_ops)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS telaah_posts_material_trgm_index');
        }

        Schema::table('telaah_posts', function (Blueprint $table) {
            $table->dropColumn('material_text');
        });
    }
};
