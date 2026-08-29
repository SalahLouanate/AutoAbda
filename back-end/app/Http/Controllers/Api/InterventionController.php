<?php

namespace App\Http\Controllers\Api;

use App\Events\InterventionStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\Intervention;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterventionController extends Controller
{
    /**
     * Mettre à jour le statut d'une intervention (ex: "en pause", "en cours", "terminee", "annulee").
     * PATCH /api/direction/interventions/{id}/status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'statut' => 'required|string',
        ]);

        $intervention = Intervention::findOrFail($id);

        $newStatut = $request->input('statut');
        $statutLower = mb_strtolower($newStatut);

        // Normalisation éventuelle ou conservation de la chaîne transmise
        if (in_array($statutLower, ['en pause', 'pause', 'en_pause'])) {
            $intervention->statut = 'En pause';
            if (!$intervention->motif_blocage) {
                $intervention->motif_blocage = 'Mise en pause par le chef d\'atelier';
            }
        } elseif (in_array($statutLower, ['en cours', 'en_cours'])) {
            $intervention->statut = 'En cours';
            $intervention->motif_blocage = null;
        } elseif (in_array($statutLower, ['terminé', 'termine', 'terminee', 'terminée'])) {
            $intervention->statut = 'Terminé';
            if (!$intervention->date_fin) {
                $intervention->date_fin = now();
            }
        } elseif (in_array($statutLower, ['annulé', 'annule', 'annulee', 'annulée'])) {
            $intervention->statut = 'annule';
        } else {
            $intervention->statut = $newStatut;
        }

        $intervention->save();

        // Chargement des relations pour le payload et le broadcast
        $intervention->load(['vehicule:id,matricule,marque,modele', 'pont:id,nom,statut', 'user:id,name,email']);

        // Diffusion WebSocket Reverb temps réel
        broadcast(new InterventionStatusChanged($intervention));

        return response()->json([
            'status'       => 'success',
            'message'      => 'Statut de l\'intervention mis à jour avec succès.',
            'statut'       => $intervention->statut,
            'intervention' => $intervention,
        ], 200);
    }
}
