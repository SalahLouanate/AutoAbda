<?php

namespace App\Http\Controllers\Api;

use App\Events\InterventionStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\Intervention;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterventionController extends Controller
{
    /**
     * Mettre à jour le statut d'une intervention (ex: "en pause", "en cours", "terminee", "annulee").
     * PATCH /api/direction/interventions/{id}/status
     *
     * CORRECTION CHRONO :
     *  - Passage en "En pause" : accumule le temps écoulé et stoppe heure_reprise.
     *  - Passage en "En cours" : relance le timer (heure_reprise = now()).
     *  - Passage en "Terminé"  : accumule le temps final avant clôture.
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'statut' => 'required|string',
        ]);

        $intervention = Intervention::findOrFail($id);

        $newStatut   = $request->input('statut');
        $statutLower = mb_strtolower($newStatut);

        if (in_array($statutLower, ['en pause', 'pause', 'en_pause', 'bloqué', 'bloque'])) {
            // 🛑 1. MÉTHODE DE BLOCAGE / PAUSE :
            // - Calcule la différence entre now() et heure_reprise.
            // - Ajoute cette différence au temps_passe actuel.
            // - IMPÉRATIF : Mets heure_reprise à NULL.
            // - Sauvegarde.
            $intervention->accumulerTempsEtStopperTimer();
            $intervention->statut = in_array($statutLower, ['bloqué', 'bloque']) ? 'Bloqué' : 'En pause';
            if (!$intervention->motif_blocage && !in_array($statutLower, ['bloqué', 'bloque'])) {
                $intervention->motif_blocage = "Mise en pause par le chef d'atelier";
            }

        } elseif (in_array($statutLower, ['en cours', 'en_cours'])) {
            // 🟢 2. MÉTHODE DE REPRISE ("Reprendre") :
            // - Tu ne dois faire AUCUN calcul d'addition de temps à ce moment précis.
            // - IMPÉRATIF : Mets simplement la colonne heure_reprise à la date et l'heure exactes (now()).
            // - Change le statut en "En cours".
            // - Sauvegarde.
            $intervention->statut        = 'En cours';
            $intervention->motif_blocage = null;

            if (!$intervention->date_debut) {
                $intervention->date_debut = now();
            }

            // Réinitialisation du chrono au point de reprise
            $intervention->demarrerChrono();

        } elseif (in_array($statutLower, ['terminé', 'termine', 'terminee', 'terminée'])) {
            // ✅ CLÔTURE : Accumuler le temps restant avant de fermer
            $intervention->accumulerTempsEtStopperTimer();
            $intervention->statut = 'Terminé';
            if (!$intervention->date_fin) {
                $intervention->date_fin = now();
            }

        } elseif (in_array($statutLower, ['annulé', 'annule', 'annulee', 'annulée'])) {
            $intervention->accumulerTempsEtStopperTimer();
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
            'message'      => "Statut de l'intervention mis à jour avec succès.",
            'statut'       => $intervention->statut,
            'intervention' => $intervention,
        ], 200);
    }
}
