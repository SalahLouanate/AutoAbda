<?php

namespace App\Http\Controllers\Api;

use App\Events\NewVehicleArrived;
use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Prestation;
use App\Models\Vehicule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceptionController extends Controller
{
    /**
     * Obtenir le catalogue des prestations pour le module Réception.
     */
    public function getInterventions(): JsonResponse
    {
        $prestations = Prestation::select('id', 'nom', 'categorie', 'temps_bareme', 'tarif')
            ->orderBy('nom', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'interventions' => $prestations,
        ]);
    }

    /**
     * Enregistrer un nouveau véhicule / ticket en file d'attente.
     */
    public function storeTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'immatriculation' => 'required|string|max:50',
            'marque'          => 'required|string|max:100',
            'is_rdv'          => 'nullable|boolean',
            'interventions'   => 'required|array|min:1',
            'interventions.*' => 'required|string',
        ]);

        $matricule = strtoupper(trim($validated['immatriculation']));
        $marqueComplete = trim($validated['marque']);

        // Extraire la marque et le modèle
        $parts = explode(' ', $marqueComplete, 2);
        $marque = $parts[0];
        $modele = $parts[1] ?? 'Express';

        // 1. Enregistrer ou récupérer le véhicule
        $vehicule = Vehicule::firstOrCreate(
            ['matricule' => $matricule],
            [
                'marque' => $marque,
                'modele' => $modele,
            ]
        );

        $interventionsList = $validated['interventions'];

        // 2. Attacher les prestations dans la table pivot Many-to-Many
        $prestationIds = Prestation::whereIn('nom', $interventionsList)
            ->orWhereIn('id', $interventionsList)
            ->pluck('id')
            ->toArray();

        if (!empty($prestationIds)) {
            $vehicule->prestations()->syncWithoutDetaching($prestationIds);
        }

        // Formater les prestations sous forme de chaîne textuelle pour le ticket d'intervention
        $typeInterventionLabel = implode(', ', $interventionsList);

        // 3. Créer le ticket d'intervention
        $intervention = Intervention::create([
            'vehicule_id'       => $vehicule->id,
            'user_id'           => null,
            'pont_id'           => null,
            'type_intervention' => $typeInterventionLabel,
            'statut'            => 'En attente',
        ]);

        $intervention->load(['vehicule']);

        // 4. Déclencher l'événement Temps Réel Reverb (ShouldBroadcast asynchrone)
        event(new NewVehicleArrived($intervention));

        $heureArrivee = $intervention->created_at ? $intervention->created_at->format('H:i') : date('H:i');

        return response()->json([
            'status'  => 'success',
            'message' => 'Ticket enregistré avec succès et transmis à l\'atelier.',
            'ticket'  => [
                'id'            => $intervention->id,
                'immat'         => $vehicule->matricule,
                'marque'        => "{$vehicule->marque} {$vehicule->modele}",
                'interventions' => $interventionsList,
                'rdv'           => (bool) ($validated['is_rdv'] ?? false),
                'heure'         => $heureArrivee,
                'technicien'    => 'Non assigné',
            ]
        ], 201);
    }
}
