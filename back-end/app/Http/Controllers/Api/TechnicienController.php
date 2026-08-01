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
     * Démarrer une intervention (Mise à jour statut => 'En cours', started_at / date_debut => now()).
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

        // 1. Mise à jour explicite du statut et enregistrement du timestamp de début (started_at)
        $intervention->statut = 'En cours';
        $intervention->motif_blocage = null;
        if (!$intervention->date_debut) {
            $intervention->date_debut = now();
        }
        $intervention->save();

        // Passation du pont en statut 'Occupé'
        if ($intervention->pont_id) {
            $pont = Pont::find($intervention->pont_id);
            if ($pont) {
                $pont->update(['statut' => 'Occupé']);
            }
        }

        $intervention->load(['vehicule', 'pont', 'user']);

        // 2. Diffusion immédiate des événements Temps Réel Reverb via ShouldBroadcastNow
        broadcast(new TicketStatusUpdated($intervention));
        broadcast(new InterventionStatusChanged($intervention));
        broadcast(new PontStatusUpdated());

        return response()->json([
            'message'      => 'Intervention démarrée avec succès.',
            'intervention' => $intervention,
        ], 200);
    }

    /**
     * Signaler un blocage sur une intervention (Statut Bloqué).
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

        $intervention->statut = 'Bloqué';
        $intervention->motif_blocage = $request->input('motif');
        $intervention->save();

        $intervention->load(['vehicule', 'pont', 'user']);

        broadcast(new TicketStatusUpdated($intervention));
        broadcast(new InterventionStatusChanged($intervention));
        broadcast(new PontStatusUpdated());

        return response()->json([
            'message'      => 'Intervention marquée comme bloquée.',
            'intervention' => $intervention,
        ], 200);
    }

    /**
     * Terminer une intervention.
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

        $intervention->statut = 'Terminé';
        $intervention->date_fin = now();
        $intervention->save();

        if ($intervention->pont_id) {
            $pont = Pont::find($intervention->pont_id);
            if ($pont) {
                $pont->update(['statut' => 'Libre']);
            }
        }

        $intervention->load(['vehicule', 'pont', 'user']);

        broadcast(new TicketStatusUpdated($intervention));
        broadcast(new InterventionStatusChanged($intervention));
        broadcast(new PontStatusUpdated());

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

        $history = Intervention::with(['vehicule', 'pont'])
            ->where('user_id', $userId)
            ->where('statut', 'Terminé')
            ->where(function ($query) {
                $query->whereDate('date_fin', Carbon::today())
                      ->orWhereDate('updated_at', Carbon::today())
                      ->orWhereDate('created_at', Carbon::today());
            })
            ->orderBy('date_fin', 'desc')
            ->get();

        return response()->json([
            'message' => 'Historique des interventions récupéré.',
            'history' => $history,
        ], 200);
    }
}
