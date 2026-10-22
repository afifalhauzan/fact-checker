<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    public function test_saving_messages_creates_the_conversation_and_returns_history(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $id = (string) Str::uuid();

        $this->postJson("/api/conversations/{$id}/messages", [
            'messages' => [
                ['id' => 'msg-1', 'role' => 'user', 'content' => 'Cek lowongan ini'],
                [
                    'id' => 'msg-2',
                    'role' => 'assistant',
                    'content' => 'Berikut hasil telaahnya.',
                    'meta_data' => ['parts' => [['type' => 'text', 'text' => 'Berikut hasil telaahnya.']]],
                ],
            ],
        ])->assertCreated()->assertJsonPath('id', $id);

        $this->getJson("/api/conversations/{$id}/messages")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', 'msg-1')
            ->assertJsonPath('data.1.meta_data.parts.0.type', 'text');

        $this->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Cek lowongan ini');
    }

    public function test_a_title_sent_with_the_messages_replaces_the_fallback_title(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $id = (string) Str::uuid();

        $this->postJson("/api/conversations/{$id}/messages", [
            'messages' => [['id' => 'msg-1', 'role' => 'user', 'content' => 'Cek lowongan ini']],
        ])->assertCreated();

        $this->postJson("/api/conversations/{$id}/messages", [
            'messages' => [['id' => 'msg-2', 'role' => 'assistant', 'content' => 'Hasil telaah']],
            'title' => '  Lowongan Staff Admin PT Contoh  ',
        ])->assertOk();

        $this->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Lowongan Staff Admin PT Contoh');

        $this->postJson("/api/conversations/{$id}/messages", [
            'messages' => [['id' => 'msg-3', 'role' => 'user', 'content' => 'x']],
            'title' => str_repeat('a', 121),
        ])->assertUnprocessable();
    }

    public function test_saving_the_same_message_again_updates_it(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $id = (string) Str::uuid();

        foreach (['draft', 'final'] as $content) {
            $this->postJson("/api/conversations/{$id}/messages", [
                'messages' => [['id' => 'msg-1', 'role' => 'assistant', 'content' => $content]],
            ])->assertSuccessful();
        }

        $this->assertDatabaseCount('messages', 1);
        $this->assertDatabaseHas('messages', ['client_id' => 'msg-1', 'content' => 'final']);
    }

    public function test_a_replaced_answer_is_removed_when_its_replacement_is_saved(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $id = (string) Str::uuid();

        $this->postJson("/api/conversations/{$id}/messages", [
            'messages' => [
                ['id' => 'msg-1', 'role' => 'user', 'content' => 'Cek lowongan ini'],
                ['id' => 'msg-2', 'role' => 'assistant', 'content' => 'Sudah ditelaah sebelumnya'],
            ],
        ])->assertCreated();

        $this->postJson("/api/conversations/{$id}/messages", [
            'messages' => [
                ['id' => 'msg-1', 'role' => 'user', 'content' => 'Cek lowongan ini'],
                ['id' => 'msg-3', 'role' => 'assistant', 'content' => 'Hasil telaah sendiri'],
            ],
            'replaced_ids' => ['msg-2'],
        ])->assertOk();

        $this->getJson("/api/conversations/{$id}/messages")
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.1.id', 'msg-3');
    }

    public function test_users_cannot_read_or_write_each_others_conversations(): void
    {
        $id = (string) Str::uuid();
        $payload = ['messages' => [['id' => 'msg-1', 'role' => 'user', 'content' => 'Rahasia']]];

        Sanctum::actingAs(User::factory()->create());
        $this->postJson("/api/conversations/{$id}/messages", $payload)->assertCreated();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/conversations/{$id}/messages")->assertOk()->assertJsonCount(0, 'data');
        $this->postJson("/api/conversations/{$id}/messages", $payload)->assertNotFound();
        $this->deleteJson("/api/conversations/{$id}")->assertNotFound();

        $this->assertDatabaseCount('messages', 1);
    }

    public function test_owner_can_pin_and_unpin_without_reordering_history(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $id = (string) Str::uuid();

        $this->postJson("/api/conversations/{$id}/messages", [
            'messages' => [['id' => 'msg-1', 'role' => 'user', 'content' => 'Halo']],
        ])->assertCreated();
        $updatedAt = $this->getJson('/api/conversations')->json('data.0.updated_at');

        $this->travel(5)->minutes();
        $this->patchJson("/api/conversations/{$id}", ['pinned' => true])->assertOk();
        $this->getJson('/api/conversations')
            ->assertJsonPath('data.0.updated_at', $updatedAt)
            ->assertJsonPath('data.0.pinned_at', fn ($value) => $value !== null);

        $this->patchJson("/api/conversations/{$id}", ['pinned' => false])->assertOk();
        $this->getJson('/api/conversations')->assertJsonPath('data.0.pinned_at', null);

        Sanctum::actingAs(User::factory()->create());
        $this->patchJson("/api/conversations/{$id}", ['pinned' => true])->assertNotFound();
    }

    public function test_the_owner_rates_an_answer_and_the_rating_survives_a_resave(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $id = (string) Str::uuid();
        $messages = [
            ['id' => 'msg-1', 'role' => 'user', 'content' => 'Cek lowongan ini'],
            ['id' => 'msg-2', 'role' => 'assistant', 'content' => 'Tingkat risiko: Sedang'],
        ];
        $this->postJson("/api/conversations/{$id}/messages", ['messages' => $messages])->assertCreated();

        $this->putJson("/api/conversations/{$id}/messages/msg-2/feedback", ['rating' => 'buruk', 'reason' => 'Penilaian risiko keliru'])
            ->assertOk()->assertJsonPath('feedback', 'buruk');
        $this->assertDatabaseHas('messages', ['client_id' => 'msg-2', 'feedback' => 'buruk', 'feedback_reason' => 'Penilaian risiko keliru']);

        // Saving the exchange again (e.g. a regenerated title) keeps the rating
        $this->postJson("/api/conversations/{$id}/messages", ['messages' => $messages])->assertOk();
        $this->getJson("/api/conversations/{$id}/messages")->assertJsonPath('data.1.feedback', 'buruk');

        $this->putJson("/api/conversations/{$id}/messages/msg-2/feedback", ['rating' => 'baik', 'reason' => 'x'])->assertOk();
        $this->assertDatabaseHas('messages', ['client_id' => 'msg-2', 'feedback' => 'baik', 'feedback_reason' => null]);

        // Only answers can be rated, only valid ratings, and only by the owner
        $this->putJson("/api/conversations/{$id}/messages/msg-1/feedback", ['rating' => 'baik'])->assertNotFound();
        $this->putJson("/api/conversations/{$id}/messages/msg-2/feedback", ['rating' => 'lumayan'])->assertUnprocessable();
        Sanctum::actingAs(User::factory()->create());
        $this->putJson("/api/conversations/{$id}/messages/msg-2/feedback", ['rating' => 'buruk'])->assertNotFound();
    }

    public function test_owner_can_delete_a_conversation(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $id = (string) Str::uuid();

        $this->postJson("/api/conversations/{$id}/messages", [
            'messages' => [['id' => 'msg-1', 'role' => 'user', 'content' => 'Halo']],
        ])->assertCreated();

        $this->deleteJson("/api/conversations/{$id}")->assertOk();

        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_attachments_are_stored_privately_reused_on_resave_and_deleted_with_the_conversation(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($owner = User::factory()->create());
        $id = (string) Str::uuid();
        // A real 1x1 PNG: the container has no GD for fake()->image()
        $poster = UploadedFile::fake()->createWithContent(
            'poster.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
        );
        $save = fn () => $this->post("/api/conversations/{$id}/messages", [
            'payload' => json_encode(['messages' => [[
                'id' => 'msg-1',
                'role' => 'user',
                'content' => 'Cek ini',
                'meta_data' => ['parts' => [
                    ['type' => 'text', 'text' => 'Cek ini'],
                    ['type' => 'file', 'mediaType' => 'image/png', 'filename' => 'poster.png', 'url' => 'upload:0'],
                    // Inline bytes that were not uploaded are never kept in the row
                    ['type' => 'file', 'mediaType' => 'image/png', 'filename' => 'lain.png', 'url' => 'data:image/png;base64,AAAA'],
                ]],
            ]]]),
            'files' => [$poster],
        ], ['Accept' => 'application/json']);

        $save()->assertCreated();
        $save()->assertOk();
        $this->assertDatabaseCount('chat_attachments', 1);

        $parts = $this->getJson("/api/conversations/{$id}/messages")->json('data.0.meta_data.parts');
        $this->assertMatchesRegularExpression("#^/api/chat/attachments/{$id}/[0-9a-f-]{36}$#", $parts[1]['url']);
        $this->assertSame(['type' => 'text', 'text' => '[Lampiran: lain.png]'], $parts[2]);

        $attachmentId = basename($parts[1]['url']);
        $this->get("/api/conversations/{$id}/attachments/{$attachmentId}")
            ->assertOk()->assertHeader('Content-Type', 'image/png')->assertHeader('X-Content-Type-Options', 'nosniff');

        Sanctum::actingAs(User::factory()->create());
        $this->get("/api/conversations/{$id}/attachments/{$attachmentId}")->assertNotFound();

        Sanctum::actingAs($owner);
        $this->deleteJson("/api/conversations/{$id}")->assertOk();
        $this->assertDatabaseCount('chat_attachments', 0);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_attachments_of_other_types_are_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->post('/api/conversations/'.Str::uuid().'/messages', [
            'payload' => json_encode(['messages' => [['id' => 'msg-1', 'role' => 'user', 'content' => 'x']]]),
            'files' => [UploadedFile::fake()->create('script.svg', 1, 'image/svg+xml')],
        ], ['Accept' => 'application/json'])->assertUnprocessable();
    }

    public function test_conversations_require_authentication(): void
    {
        $this->getJson('/api/conversations')->assertUnauthorized();
        $this->postJson('/api/conversations/'.Str::uuid().'/messages', [])->assertUnauthorized();
    }
}
