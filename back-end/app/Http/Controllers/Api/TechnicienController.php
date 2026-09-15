<?php

namespace App\Http\Controllers\Api;

use App\Events\InterventionStatusChanged;
use App\Events\PontStatusUpdated;
use App\Events\TicketStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Pont;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnicienController extends Controller
{
    /**
     * Récupérer la liste complète des interventions ('En cours', 'Bloqué' ou 'En attente') assignées au technicien connecté.
     * Retourne TOUS les véhicules assignés par ordre de priorité et d'arrivée (FIFO).
     */
    public function getCurrentTask(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $interventions = Intervention::with(['vehicule', 'pont'])
            ->where('user_id', $userId)
            ->whereIn('statut', ['En cours', 'Bloqué', 'En attente'])
            ->orderByRaw("CASE WHEN LOWER(statut) IN ('en cours', 'en_cours') THEN 1 WHEN LOWER(statut) IN ('bloqué', 'bloque') THEN 2 WHEN LOWER(statut) IN ('en attente', 'en_attente') THEN 3 ELSE 4 END")
            ->orderByRaw("COALESCE(is_rdv, 0) DESC")
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'message'       => 'Interventions récupérées avec succès',
            'interventions' => $interventions,
            'intervention'  => $interventions->first() ?? null,
        ], 200);
    }

    /**
     * 2. MÉTHODE DE REPRISE ("Reprendre") / DÉMARRAGE :
     * Quand on passe du statut "Bloqué/Pause" au statut "En cours" :
     * - Tu ne dois faire AUCUN calcul d'addition de temps à ce moment précis.
     * - IMPÉRATIF : Mets simplement la colonne heure_reprise à now().
     * - Change le statut en "En cours".
     * - Sauvegarde.
     */
    public function startTask(Request $request, $id): JsonResponse
    {
        $intervention = Intervention::find($id);

        if (!$intervention) {
            return response()->json([
                'message' => 'Intervention introuvable.',
            ], 404);
        }

        $user = $request->user();

        if ($intervention->user_id !== $user->id) {
            return response()->json([
                'message' => 'Non autorisé. Cette intervention ne vous est pas assignée.',
            ], 403);
        }

        // Affectation automatique du pont du technicien s'il n'est pas encore défini
        if (!$intervention->pont_id && $user->pont_id) {
            $intervention->pont_id = $user->pont_id;
        }

        // 1. Mise à jour statut => "En cours"
        $intervention->statut        = 'En cours';
        $intervention->motif_blocage = null;

        if (!$intervention->date_debut) {
            $intervention->date_debut = now();
        }

        // 2. IMPÉRATIF : Aucun calcul de temps à ce moment.
        // Réinitialise chrono_start_time / heure_reprise à l'instant présent comme point de départ
        $intervention->demarrerChrono();

        // 3. Sauvegarde
        $intervention->save();

        // 4. Mise à jour du pont
        if ($intervention->pont_id) {
            Pont::where('id', $intervention->pont_id)->update(['statut' => 'Occupé']);
        }

        // 5. Chargement ultra léger des relations
        $intervention->load(['vehicule:id,matricule,marque,modele', 'pont:id,nom,statut', 'user:id,name,email']);

        // 6. Broadcast temps réel
        broadcast(new InterventionStatusChanged($intervention));

        return response()->json([
            'message'      => 'Intervention démarrée avec succès.',
            'intervention' => $intervention,
        ], 200);
    }

    /**
     * Alias explicite pour la reprise de tâche (POST /technicien/tache/{id}/resume)
     */
    public function resumeTask(Request $request, $id): JsonResponse
    {
        return $this->startTask($request, $id);
    }

    /**
     * 1. MÉTHODE DE BLOCAGE / PAUSE :
     * Quand on passe en statut "Bloqué" ou "En pause" :
     * - Calcule la différence entre now() et heure_reprise.
     * - Ajoute cette différence au temps_passe (temps_passe_minutes) actuel.
     * - IMPÉRATIF : Mets heure_reprise à NULL.
     * - Sauvegarde.
     */
    public function blockTask(Request $request, $id): JsonResponse
    {
        $intervention = Intervention::find($id);

        if (!$intervention) {
            return response()->json([
                'message' => 'Intervention introuvable.',
            ], 404);
        }

        if ($intervention->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Non autorisé. Cette intervention ne vous est pas assignée.',
            ], 403);
        }

        $request->validate([
            'motif' => 'required|string|max:255',
        ]);

        // 1 & 2 & 3. Calcul de la différence entre now() et heure_reprise, ajout au temps_passe, et mise à NULL d'heure_reprise
        $intervention->accumulerTempsEtStopperTimer();

        // 4. Mise à jour statut et motif
        $intervention->statut        = 'Bloqué';
        $intervention->motif_blocage = $request->input('motif');

        // 5. Sauvegarde
        $intervention->save();

        $intervention->load(['vehicule:id,matricule,marque,modele', 'pont:id,nom,statut', 'user:id,name,email']);

        broadcast(new InterventionStatusChanged($intervention));

        return response()->json([
            'message'      => 'Intervention marquée comme bloquée.',
            'intervention' => $intervention,
        ], 200);
    }

    /**
     * Terminer une intervention.
     *
     * CORRECTION CHRONO : Accumule le temps restant avant de clore pour que
     * temps_passe_minutes soit exact au moment du calcul de bilan/prime.
     */
    public function finishTask(Request $request, $id): JsonResponse
    {
        $intervention = Intervention::find($id);

        if (!$intervention) {
            return response()->json([
                'message' => 'Intervention introuvable.',
            ], 404);
        }

        if ($intervention->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Non autorisé. Cette intervention ne vous est pas assignée.',
            ], 403);
        }

        // ✅ CORRECTION CHRONO : Accumulation finale avant clôture
        $intervention->accumulerTempsEtStopperTimer();

        $intervention->statut   = 'Terminé';
        $intervention->date_fin = now();
        $intervention->save();

        if ($intervention->pont_id) {
            Pont::where('id', $intervention->pont_id)->update(['statut' => 'Libre']);
        }

        $intervention->load(['vehicule:id,matricule,marque,modele', 'pont:id,nom,statut', 'user:id,name,email']);

        broadcast(new InterventionStatusChanged($intervention));

        return response()->json([
            'message'      => 'Intervention terminée avec succès.',
            'intervention' => $intervention,
        ], 200);
    }

    /**
     * Obtenir l'historique des interventions terminées du technicien pour la journée.
     */
    public function getHistory(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // ✅ Filtrage STRICT par date de création du ticket pour la journée en cours
        $history = Intervention::with(['vehicule', 'pont'])
            ->where('user_id', $userId)
            ->where('statut', 'Terminé')
            ->whereDate('created_at', Carbon::today())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Historique des interventions récupéré.',
            'history' => $history,
        ], 200);
    }
}
