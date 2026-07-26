<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckActiveStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user() ?? Auth::user();

        if ($user) {
            $isInactive = ($user->is_active === false || $user->is_active === 0)
                || (isset($user->statut) && strtolower((string) $user->statut) === 'inactif');

            if ($isInactive) {
                // Révocation du token Sanctum courant
                if (method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
                    $user->currentAccessToken()->delete();
                }

                Auth::logout();

                return response()->json([
                    'message' => 'Votre compte a été désactivé par la direction.',
                ], 403);
            }
        }

        return $next($request);
    }
}
