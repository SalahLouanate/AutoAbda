<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Pont;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Obtenir les statistiques globales pour le Dashboard Direction / Chef d'Atelier.
     */
    public function getStats(Request $request): JsonResponse
    {
        $today = Carbon::today();

        // 1. Nombre total de ponts
        $totalPonts = Pont::count();

        // 2. Nombre d'interventions avec le statut 'En cours' aujourd'hui
        $pontsActifs = Intervention::whereDate('created_at', $today)->where('statut', 'En cours')->count();

        // 3. Taux d'occupation (pourcentage)
        $tauxOccupation = $totalPonts > 0 ? round(($pontsActifs / $totalPonts) * 100, 2) : 0;

        // 4. Nombre total d'interventions créées aujourd'hui
        $interventionsDuJour = Intervention::whereDate('created_at', $today)->count();

        // 5. Nombre d'interventions d'aujourd'hui avec le statut 'Terminé'
        $interventionsTermineesJour = Intervention::whereDate('created_at', $today)
            ->where('statut', 'Terminé')
            ->count();

        // 6. Liste complète des ponts avec leur intervention en cours et relations (vehicule, user/technicien)
        $pontsDetails = Pont::with([
            'activeIntervention.vehicule:id,matricule,marque,modele',
            'activeIntervention.user:id,name,email,role',
            'users:id,name,email,role,pont_id',
        ])->get()->map(function ($pont) {
            return [
                'id'                    => $pont->id,
                'nom'                   => $pont->nom,
                'statut'                => $pont->statut,
                'technicien'            => $pont->users->first(),
                'intervention_en_cours' => $pont->activeIntervention,
            ];
        });

        return response()->json([
            'total_ponts'                  => $totalPonts,
            'ponts_actifs'                 => $pontsActifs,
            'taux_occupation'              => $tauxOccupation,
            'interventions_du_jour'        => $interventionsDuJour,
            'interventions_terminees_jour' => $interventionsTermineesJour,
            'ponts_details'                => $pontsDetails,
        ], 200);
    }
}
