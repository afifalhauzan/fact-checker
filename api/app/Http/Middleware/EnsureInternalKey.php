<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets a request through only when it carries the web server's X-Internal-Key. Those requests
 * have already been checked there: signed analysis payload, redaction, comment flags.
 */
class EnsureInternalKey
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(self::isInternal($request), 403);

        return $next($request);
    }

    public static function isInternal(Request $request): bool
    {
        $key = (string) config('services.telaah.internal_key');

        return $key !== '' && hash_equals($key, (string) $request->header('X-Internal-Key'));
    }

    /**
     * The visitor's IP. Every request arrives from the web app's server, which forwards the
     * visitor's address in X-Client-IP; the header is believed only together with the internal key.
     */
    public static function clientIp(Request $request): string
    {
        $forwarded = self::isInternal($request) ? (string) $request->header('X-Client-IP') : '';

        return filter_var($forwarded, FILTER_VALIDATE_IP) ? $forwarded : (string) $request->ip();
    }
}
