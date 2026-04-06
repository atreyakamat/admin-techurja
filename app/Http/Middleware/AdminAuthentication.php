<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * AdminAuthentication – checks the session for admin login.
 * The admin authenticates with a server-side password stored
 * as the ADMIN_PASSWORD environment variable.
 */
class AdminAuthentication
{
    public function handle(Request $request, Closure $next): Response
    {
        $adminSecret = env('ADMIN_SECRET');
        $token = $request->bearerToken();

        // Allow if Bearer token matches ADMIN_SECRET (Stateless for React SPA)
        if ($token && hash_equals($adminSecret ?? '', $token)) {
            return $next($request);
        }

        // Fallback: Check standard session-based auth
        if (!$request->session()->get('admin_authenticated', false)) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            return redirect()->route('admin.login')
                ->with('error', 'Please log in to access the admin panel.');
        }

        return $next($request);
    }
}
