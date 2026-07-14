<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureYapinetApiKey
{
    /**
     * Handle an incoming request.
     *
     * Protects Yapinet integration endpoints with a static API key sent as a
     * Bearer token, rather than the app's Sanctum session-based auth (those
     * endpoints are called by an external portal, not a logged-in browser).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $expected = config('services.yapinet.api_key');

        if (! $token || ! $expected || ! hash_equals($expected, $token)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
