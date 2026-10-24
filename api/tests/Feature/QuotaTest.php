<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuotaTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = 'test-internal-key';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.telaah.internal_key' => self::KEY]);
    }

    private function internal(string $ip = '203.0.113.7'): static
    {
        return $this->withHeaders(['X-Internal-Key' => self::KEY, 'X-Client-IP' => $ip]);
    }

    private function start(string $conversation): TestResponse
    {
        return $this->internal()->postJson("/api/quota/sessions/{$conversation}/start");
    }

    public function test_an_account_gets_five_new_sessions_a_day_and_can_keep_using_them(): void
    {
        Sanctum::actingAs($user = User::factory()->create());
        $sessions = array_map(fn () => (string) Str::uuid(), range(1, 5));

        foreach ($sessions as $index => $id) {
            $this->start($id)->assertOk()->assertJsonPath('sessionsUsed', $index + 1);
        }
        $this->start((string) Str::uuid())->assertStatus(429)->assertJsonPath('reason', 'daily_limit');

        // An open session keeps working after the limit, and asking again does not count twice
        $this->start($sessions[0])->assertOk()->assertJsonPath('sessionsUsed', 5);
        $this->getJson('/api/quota')->assertJsonPath('sessionsUsed', 5)->assertJsonPath('sessionsLimit', 5);

        // The day resets at midnight in Jakarta
        $this->travelTo(now('Asia/Jakarta')->addDay()->startOfDay()->addMinute());
        $this->start((string) Str::uuid())->assertOk()->assertJsonPath('sessionsUsed', 1);
    }

    public function test_an_exempt_account_has_no_daily_limit(): void
    {
        config(['services.quota.daily_sessions' => 1, 'services.quota.exempt_emails' => ['demo@telaahkarier.com']]);
        Sanctum::actingAs(User::factory()->create(['email' => 'Demo@TelaahKarier.com']));

        $this->start((string) Str::uuid())->assertOk();
        $this->start((string) Str::uuid())->assertOk()->assertJsonPath('exempt', true);
    }

    public function test_usage_is_charged_only_by_the_sessions_owner(): void
    {
        $id = (string) Str::uuid();
        Sanctum::actingAs(User::factory()->create());
        $this->start($id);
        $this->internal()->postJson("/api/quota/sessions/{$id}/usage", ['tokens' => 4200])->assertJsonPath('sessionTokens', 4200);
        $this->internal()->postJson("/api/quota/sessions/{$id}/usage", ['tokens' => 800])->assertJsonPath('sessionTokens', 5000);
        $this->getJson("/api/quota?conversation_id={$id}")->assertJsonPath('sessionTokens', 5000);

        Sanctum::actingAs(User::factory()->create());
        $this->start($id)->assertNotFound();
        $this->internal()->postJson("/api/quota/sessions/{$id}/usage", ['tokens' => 1])->assertNotFound();
    }

    public function test_guest_sessions_are_capped_per_ip_and_taken_over_on_sign_in(): void
    {
        config(['services.quota.guest_sessions_per_ip' => 2]);
        $first = (string) Str::uuid();

        $this->start($first)->assertOk()->assertJsonPath('guest', true);
        $this->start($first)->assertOk();
        $this->start((string) Str::uuid())->assertOk();
        $this->start((string) Str::uuid())->assertStatus(429)->assertJsonPath('reason', 'guest_ip_limit');
        $this->internal('198.51.100.4')->postJson('/api/quota/sessions/'.Str::uuid().'/start')->assertOk();

        // Signing in keeps the guest's session and counts it as the account's
        Sanctum::actingAs(User::factory()->create());
        $this->start($first)->assertOk()->assertJsonPath('sessionsUsed', 1);
    }

    public function test_the_quota_endpoints_need_the_web_servers_key(): void
    {
        $this->postJson('/api/quota/sessions/'.Str::uuid().'/start')->assertForbidden();
        $this->getJson('/api/quota')->assertUnauthorized();
    }

    public function test_sign_ups_are_limited_per_visitor_ip(): void
    {
        config(['services.quota.signups_per_ip_hour' => 2]);
        $signUp = fn (string $ip, int $n) => $this->internal($ip)->postJson('/api/auth/register', [
            'name' => "Pengguna {$n}",
            'email' => "pengguna{$n}@example.com",
            'password' => 'rahasia-panjang-123',
            'password_confirmation' => 'rahasia-panjang-123',
        ]);

        $signUp('203.0.113.7', 1)->assertCreated();
        $signUp('203.0.113.7', 2)->assertCreated();
        $signUp('203.0.113.7', 3)->assertStatus(429);
        // Another visitor is not affected, though every request comes from the same web server
        $signUp('198.51.100.4', 4)->assertCreated();
    }
}
