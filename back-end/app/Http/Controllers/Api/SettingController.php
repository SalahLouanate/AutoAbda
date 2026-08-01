<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Obtenir l'heure de fermeture automatique de l'atelier (key: auto_closing_time).
     * GET /api/settings/auto-closing-time
     */
    public function getAutoClosingTime(): JsonResponse
    {
        $setting = Setting::where('key', 'auto_closing_time')->first();
        $time = $setting ? $setting->value : '19:00';

        return response()->json([
            'status'            => 'success',
            'key'               => 'auto_closing_time',
            'auto_closing_time' => $time,
            'value'             => $time,
        ]);
    }

    /**
     * Mettre à jour l'heure de fermeture automatique de l'atelier.
     * PUT /api/settings/auto-closing-time
     */
    public function updateAutoClosingTime(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'auto_closing_time' => 'nullable|string|regex:/^(?:[01]\d|2[0-3]):[0-5]\d$/',
            'value'             => 'nullable|string|regex:/^(?:[01]\d|2[0-3]):[0-5]\d$/',
        ]);

        $time = $validated['auto_closing_time'] ?? $validated['value'] ?? $request->input('auto_closing_time') ?? $request->input('value');

        if (!$time) {
            return response()->json([
                'status'  => 'error',
                'message' => 'L\'heure de fermeture est requise (format HH:mm).',
            ], 422);
        }

        $setting = Setting::updateOrCreate(
            ['key' => 'auto_closing_time'],
            ['value' => $time]
        );

        return response()->json([
            'status'            => 'success',
            'message'           => 'Heure de fermeture automatique de l\'atelier mise à jour avec succès.',
            'key'               => 'auto_closing_time',
            'auto_closing_time' => $setting->value,
            'value'             => $setting->value,
        ], 200);
    }
}
