<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ApiDocsAccess
{
    public function handle(Request $request, Closure $next)
    {
        if (!Gate::allows('viewApiDocs')) {
            return redirect('/docs-login')->with('error', 'You need to login to access API documentation.');
        }

        return $next($request);
    }
}