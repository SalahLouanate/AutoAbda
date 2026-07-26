<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Identifiants incorrects',
            ], 401);
        }

        $user = Auth::user();

        // 🛑 Sécurité : Vérification du statut actif lors de la tentative de connexion
        $isInactive = ($user->is_active === false || $user->is_active === 0)
            || (isset($user->statut) && strtolower((string) $user->statut) === 'inactif');

        if ($isInactive) {
            // Destruction des tokens existants et déconnexion
            $user->tokens()->delete();
            Auth::logout();

            return response()->json([
                'message' => 'Votre compte a été désactivé par la direction.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role'      => $user->role,
                'pont_id'   => $user->pont_id,
                'is_active' => $user->is_active ?? true,
            ],
        ], 200);
    }
}
