<?php

namespace App\Http\Controllers\Api;

use App\Events\InterventionStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Pont;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnicienController extends Controller
{
    /**
     * Récupérer l'intervention active ('En cours', 'Bloqué' ou 'En attente') assignée au technicien connecté.
     * Filtre sur la journée en cours tout en remontant les tâches non terminées des jours précédents.
     */
    public function getCurrentTask(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $interventions = Intervention::with(['vehicule', 'pont'])
            ->where('user_id', $userId)
            ->where(function ($query) {
                $query->whereDate('created_at', Carbon::today())
                      ->orWhereNotIn('statut', ['Terminé', 'Annulé']);
            })
            ->whereIn('statut', ['En cours', 'Bloqué', 'En attente'])
            ->get();

        // Donne la priorité à 'En cours', puis 'Bloqué', puis 'En attente'
        $intervention = $interventions->sortBy(function ($item) {
            if ($item->statut === 'En cours') return 0;
            if ($item->statut === 'Bloqué') return 1;
            return 2;
        })->first();

        if (!$intervention) {
            return response()->json([
                'message'      => 'Aucune intervention en cours',
                'intervention' => null,
            ], 200);
        }

        return response()->json([
            'message'      => 'Intervention récupérée avec succès',
            'intervention' => $intervention,
        ], 200);
    }

    /**
     * Démarrer une intervention.
     */
    public function startTask(Request $request, $id): JsonResponse
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

        $intervention->statut = 'En cours';
        $intervention->motif_blocage = null;
        if (!$intervention->date_debut) {
            $intervention->date_debut = now();
        }
        $intervention->save();

        if ($intervention->pont_id) {
            $pont = Pont::find($intervention->pont_id);
            if ($pont) {
                $pont->update(['statut' => 'Occupé']);
            }
        }

        $intervention->load(['vehicule', 'pont', 'user']);

        broadcast(new InterventionStatusChanged($intervention));

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

        broadcast(new InterventionStatusChanged($intervention));

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
