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
