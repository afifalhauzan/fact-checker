<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EnsureInternalKey;
use App\Models\SessionUsage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * TelaahLoker usage: sessions per day for accounts, and the tokens each session has used. The web
 * app's chat route asks before every model call (start) and reports what the call used (usage).
 */
class QuotaController extends Controller
{
    // The day resets at midnight in Indonesia, not UTC
    private const TIMEZONE = 'Asia/Jakarta';

    public function show(Request $request): JsonResponse
    {
        $data = $request->validate(['conversation_id' => ['nullable', 'uuid']]);
        $user = $request->user();
        $session = isset($data['conversation_id'])
            ? SessionUsage::where(['conversation_id' => $data['conversation_id'], 'user_id' => $user->id])->first()
            : null;

        return response()->json([...$this->state($user), 'sessionTokens' => $session?->tokens_used ?? 0]);
    }

    /**
     * Opens a session or resumes it. A signed-in user's new session takes one of the day's slots;
     * a guest's new session counts against the visitor's IP (the web app allows one per browser).
     */
    public function start(Request $request, string $conversation): JsonResponse
    {
        abort_unless(Str::isUuid($conversation), 404);
        $user = $request->user('sanctum');
        $usage = SessionUsage::where('conversation_id', $conversation)->first();

        if ($user) {
            abort_if($usage && $usage->user_id !== null && $usage->user_id !== $user->id, 404);

            // New, or the guest session the visitor has just signed in from
            if (! $usage || $usage->user_id === null) {
                if (! $this->isExempt($user) && $this->usedToday($user) >= config('services.quota.daily_sessions')) {
                    return response()->json(['reason' => 'daily_limit', ...$this->state($user)], 429);
                }
                $usage = $usage
                    ? tap($usage)->update(['user_id' => $user->id])
                    : SessionUsage::create(['user_id' => $user->id, 'conversation_id' => $conversation]);
            }

            return response()->json([...$this->state($user), 'sessionTokens' => $usage->tokens_used]);
        }

        // A signed-in user's session is not a guest's to continue
        abort_if($usage && $usage->user_id !== null, 404);

        if (! $usage) {
            $key = 'guest-sessions:'.EnsureInternalKey::clientIp($request);
            if (RateLimiter::tooManyAttempts($key, config('services.quota.guest_sessions_per_ip'))) {
                return response()->json(['reason' => 'guest_ip_limit', 'guest' => true], 429);
            }
            RateLimiter::hit($key, (int) now()->diffInSeconds($this->resetsAt(), true));
            $usage = SessionUsage::create(['conversation_id' => $conversation]);
        }

        return response()->json(['guest' => true, 'sessionTokens' => $usage->tokens_used]);
    }

    /** Adds the tokens a model call in this session used. */
    public function usage(Request $request, string $conversation): JsonResponse
    {
        $data = $request->validate(['tokens' => ['required', 'integer', 'min:0', 'max:1000000']]);
        $usage = SessionUsage::where('conversation_id', $conversation)->first();
        // A guest's session has no user; anyone else's is not this caller's to charge
        abort_unless($usage && $usage->user_id === $request->user('sanctum')?->id, 404);

        $usage->increment('tokens_used', $data['tokens']);

        return response()->json(['sessionTokens' => $usage->tokens_used]);
    }

    /**
     * @return array{sessionsUsed: int, sessionsLimit: int, resetsAt: string, exempt: bool}
     */
    private function state(User $user): array
    {
        return [
            'sessionsUsed' => $this->usedToday($user),
            'sessionsLimit' => (int) config('services.quota.daily_sessions'),
            'resetsAt' => $this->resetsAt()->toIso8601String(),
            'exempt' => $this->isExempt($user),
        ];
    }

    private function usedToday(User $user): int
    {
        // Stored in UTC, so the local midnight is converted before comparing
        $since = now(self::TIMEZONE)->startOfDay()->setTimezone(config('app.timezone'));

        return SessionUsage::where('user_id', $user->id)->where('created_at', '>=', $since)->count();
    }

    private function resetsAt(): Carbon
    {
        return now(self::TIMEZONE)->addDay()->startOfDay();
    }

    private function isExempt(User $user): bool
    {
        return in_array(strtolower($user->email), config('services.quota.exempt_emails'), true);
    }
}
