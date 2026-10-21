<?php

namespace Tests\Feature;

use App\Models\TelaahPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TelaahBersamaTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = 'test-internal-key';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.telaah.internal_key' => self::KEY]);
        Storage::fake('local');
    }

    private function internal(): static
    {
        return $this->withHeader('X-Internal-Key', self::KEY);
    }

    private function postPayload(array $overrides = []): array
    {
        return [
            'title' => 'Lowongan PT Contoh · Staff Admin · Jakarta',
            'story' => null,
            'risk_level' => 'tinggi',
            'claim' => 'Tingkat Risiko Awal: Tinggi. Diminta transfer biaya.',
            'summary' => 'Surat panggilan tes yang meminta biaya akomodasi.',
            'modus' => 'biaya',
            'evidence' => [['type' => 'payment_request', 'description' => 'Diminta transfer', 'evidence' => 'transfer Rp1.350.000']],
            'material_lines' => ['Baris satu', 'Transfer ke BRI 0000-01-778899', 'WA 0812-0000-4471'],
            'links' => ['https://contoh.example/tahap-2'],
            'contacts' => [['kind' => 'phone', 'value' => '0812-0000-4471']],
            'identifiers' => [['kind' => 'phone', 'value' => '6281200004471'], ['kind' => 'domain', 'value' => 'contoh.example']],
            'company' => 'PT Contoh',
            'position' => 'Staff Admin',
            'location' => 'Jakarta',
            'salary' => null,
            'open_date' => '2026-10-01',
            'close_date' => '2026-10-30',
            'source_platform' => 'Instagram',
            'source_account' => '@loker.contoh',
            'analyzed_at' => now()->toIso8601String(),
            'attachments' => [],
            ...$overrides,
        ];
    }

    private function createPost(User $owner, array $overrides = []): TelaahPost
    {
        Sanctum::actingAs($owner);
        $id = $this->internal()->post('/api/telaah-bersama', ['post' => json_encode($this->postPayload($overrides))])
            ->assertCreated()->json('id');

        return TelaahPost::findOrFail($id);
    }

    private function jpegWithExif(): string
    {
        $exif = "Exif\0\0GPS-LATITUDE-SECRET";

        return "\xFF\xD8"
            ."\xFF\xE0".pack('n', 16)."JFIF\0\x01\x01\0\0\x01\0\x01\0\0"
            ."\xFF\xE1".pack('n', strlen($exif) + 2).$exif
            ."\xFF\xDA".pack('n', 8)."\x01\x01\x00\x00\x3F\x00"
            ."\x12\x34\xFF\xD9";
    }

    public function test_writes_need_the_internal_key_and_an_account(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/telaah-bersama', ['post' => json_encode($this->postPayload())])->assertForbidden();
        $this->postJson('/api/telaah-bersama/similar', ['identifiers' => []])->assertForbidden();

        $this->app['auth']->forgetGuards();
        $this->internal()->postJson('/api/telaah-bersama', ['post' => json_encode($this->postPayload())])->assertUnauthorized();
    }

    public function test_publishing_stores_the_post_under_a_pseudonym_and_strips_image_metadata(): void
    {
        $owner = User::factory()->create();
        $this->assertStringStartsWith('Pencari Kerja #', $owner->pseudonym);
        Sanctum::actingAs($owner);

        $bytes = $this->jpegWithExif();
        $response = $this->internal()->post('/api/telaah-bersama', [
            'post' => json_encode($this->postPayload([
                'attachments' => [['label' => 'Surat panggilan', 'sha256' => hash('sha256', $bytes)]],
            ])),
            'files' => [UploadedFile::fake()->createWithContent('surat.jpg', $bytes)],
        ])->assertCreated();

        $response->assertJsonPath('author', $owner->pseudonym)
            ->assertJsonPath('viewer.isOwner', true)
            ->assertJsonPath('attachments.0.label', 'Surat panggilan');
        $this->assertStringNotContainsString($owner->name, $response->getContent());

        $attachment = TelaahPost::first()->attachments()->first();
        $stored = Storage::disk('local')->get($attachment->path);
        $this->assertStringNotContainsString('GPS-LATITUDE-SECRET', $stored);
        $this->assertStringContainsString('JFIF', $stored);
        $this->assertSame(hash('sha256', $bytes), $attachment->sha256);

        $this->get("/api/telaah-bersama/attachments/{$attachment->id}")->assertOk();
    }

    public function test_publishing_rejects_a_low_verdict_and_a_mismatched_file_count(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->internal()->postJson('/api/telaah-bersama', ['post' => json_encode($this->postPayload(['risk_level' => 'rendah']))])
            ->assertUnprocessable();
        $this->internal()->postJson('/api/telaah-bersama', [
            'post' => json_encode($this->postPayload(['attachments' => [['label' => 'x', 'sha256' => str_repeat('a', 64)]]])),
        ])->assertUnprocessable();
    }

    public function test_the_list_filters_and_finds_a_number_in_any_format(): void
    {
        $owner = User::factory()->create();
        $this->createPost($owner);
        $this->createPost($owner, ['risk_level' => 'sedang', 'title' => 'Kasir Surabaya', 'identifiers' => [], 'company' => null]);

        $this->getJson('/api/telaah-bersama')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/telaah-bersama?risk=sedang')->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Kasir Surabaya');
        $this->getJson('/api/telaah-bersama?q=0812-0000-4471')->assertJsonCount(1, 'data')->assertJsonPath('data.0.company', 'PT Contoh');
        $this->getJson('/api/telaah-bersama?q='.urlencode('+62 812 0000 4471'))->assertJsonCount(1, 'data');
        $this->getJson('/api/telaah-bersama?q=pt%20contoh')->assertJsonCount(1, 'data');
        $this->getJson('/api/telaah-bersama?q=tidakada')->assertJsonCount(0, 'data');
        $this->getJson('/api/telaah-bersama?from=2099-01-01')->assertJsonCount(0, 'data');
        $this->getJson('/api/telaah-bersama?mine=1')->assertJsonCount(2, 'data');
    }

    public function test_only_the_owner_edits_and_material_can_only_shrink(): void
    {
        $owner = User::factory()->create();
        $post = $this->createPost($owner);
        $edit = [
            'title' => 'Judul baru',
            'story' => 'Saya belum transfer.',
            'material_lines' => ['Baris satu', 'WA 0812-0000-4471'],
            'links' => [],
            'attachment_ids' => [],
            'still_sensitive' => false,
        ];

        Sanctum::actingAs(User::factory()->create());
        $this->internal()->patchJson("/api/telaah-bersama/{$post->id}", $edit)->assertNotFound();

        Sanctum::actingAs($owner);
        $this->internal()->patchJson("/api/telaah-bersama/{$post->id}", [...$edit, 'material_lines' => ['Baris tambahan']])
            ->assertUnprocessable();
        $this->internal()->patchJson("/api/telaah-bersama/{$post->id}", [...$edit, 'links' => ['https://lain.example']])
            ->assertUnprocessable();
        $this->internal()->patchJson("/api/telaah-bersama/{$post->id}", $edit)
            ->assertOk()->assertJsonPath('title', 'Judul baru')->assertJsonCount(2, 'materialLines');

        $this->internal()->deleteJson("/api/telaah-bersama/{$post->id}")->assertOk();
        $this->assertDatabaseCount('telaah_posts', 0);
    }

    public function test_comments_and_reactions_update_the_counts(): void
    {
        $post = $this->createPost(User::factory()->create());
        $reader = User::factory()->create();
        Sanctum::actingAs($reader);

        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/comments", [
            'body' => 'Aman kok, transfer saja.',
            'flag' => 'klaim_tanpa_bukti',
        ])->assertCreated()->assertJsonPath('author', $reader->pseudonym)->assertJsonPath('isNewAccount', true);

        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/reactions")->assertJsonPath('reacted', true)->assertJsonPath('reactionCount', 1);
        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/reactions")->assertJsonPath('reacted', false)->assertJsonPath('reactionCount', 0);
        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/reactions");

        $this->getJson("/api/telaah-bersama/{$post->id}")
            ->assertJsonPath('commentCount', 1)
            ->assertJsonPath('comments.0.flag', 'klaim_tanpa_bukti')
            ->assertJsonPath('viewer.reacted', true);
    }

    public function test_reports_count_only_from_older_accounts_and_hide_only_confirmed_personal_data(): void
    {
        $post = $this->createPost(User::factory()->create());

        Sanctum::actingAs(User::factory()->create());
        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/reports", ['type' => 'spam', 'sensitive_found' => false])->assertOk();
        $this->assertSame(0, $post->fresh()->spam_count);

        Sanctum::actingAs(User::factory()->create(['created_at' => now()->subDays(3)]));
        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/reports", ['type' => 'spam', 'sensitive_found' => false]);
        $this->assertSame(1, $post->fresh()->spam_count);

        Sanctum::actingAs(User::factory()->create(['created_at' => now()->subDays(3)]));
        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/reports", ['type' => 'data_pribadi', 'sensitive_found' => false]);
        $this->assertSame('visible', $post->fresh()->status);

        Sanctum::actingAs(User::factory()->create(['created_at' => now()->subDays(3)]));
        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/reports", ['type' => 'data_pribadi', 'sensitive_found' => true]);
        $this->assertSame('hidden_pending_edit', $post->fresh()->status);

        $this->getJson("/api/telaah-bersama/{$post->id}")->assertNotFound();
        $this->getJson('/api/telaah-bersama')->assertJsonCount(0, 'data');
    }

    public function test_similar_returns_posts_sharing_an_identifier_and_matches_count_once_per_viewer(): void
    {
        $post = $this->createPost(User::factory()->create());

        $this->internal()->postJson('/api/telaah-bersama/similar', [
            'identifiers' => [['kind' => 'phone', 'value' => '6281200004471']],
        ])->assertOk()
            ->assertJsonPath('data.0.post.id', $post->id)
            ->assertJsonPath('data.0.sharedIdentifiers.0.kind', 'phone');

        $this->internal()->postJson('/api/telaah-bersama/similar', [
            'identifiers' => [['kind' => 'phone', 'value' => '6289999999999']],
        ])->assertJsonCount(0, 'data');

        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/matched", ['viewer_key' => 'user:1']);
        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/matched", ['viewer_key' => 'user:1']);
        $this->internal()->postJson("/api/telaah-bersama/{$post->id}/matched", ['viewer_key' => 'user:2'])
            ->assertJsonPath('matchCount', 2);
    }
}
