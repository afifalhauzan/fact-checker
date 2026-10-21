<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_conversations_require_authentication(): void
    {
        $this->getJson('/api/conversations')->assertUnauthorized();
        $this->postJson('/api/conversations/'.Str::uuid().'/messages', [])->assertUnauthorized();
    }
}
