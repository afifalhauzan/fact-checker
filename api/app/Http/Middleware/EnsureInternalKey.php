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
        $key = (string) config('services.telaah.internal_key');

        abort_unless($key !== '' && hash_equals($key, (string) $request->header('X-Internal-Key')), 403);

        return $next($request);
    }
}
