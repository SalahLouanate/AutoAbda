<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pont;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RessourceController extends Controller
{
    // =========================================================================
    // 1. GESTION DU PERSONNEL (RH & TECHNICIENS)
    // =========================================================================

    /**
     * Récupère la liste complète du personnel de l'atelier.
     */
    public function indexPersonnel(Request $request): JsonResponse
    {
        $query = User::with('pont');

        // Filtre par rôle optionnel
        if ($request->has('role') && !empty($request->role)) {
            $query->where('role', $request->role);
        }

        // Filtre par statut (actif/inactif)
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $users = $query->orderBy('name')->get();

        $payload = $users->map(function ($u) {
            return [
                'id'          => $u->id,
                'nom'         => $u->name,
                'email'       => $u->email,
                'telephone'   => $u->telephone ?? 'Non renseigné',
                'role'        => $u->role,
                'role_label'  => ucfirst($u->role),
                'specialite'  => $u->specialite ?? ($u->role === 'technicien' ? 'Mécanique Générale' : 'Gestion Atelier'),
                'is_active'   => $u->is_active ?? true,
                'statut'      => ($u->is_active ?? true) ? 'Actif' : 'Inactif',
                'pont_assigne' => $u->pont ? [
                    'id'  => $u->pont->id,
                    'nom' => $u->pont->nom,
                ] : null,
            ];
        });

        return response()->json([
            'message'    => 'Liste du personnel récupérée avec succès.',
            'total'      => $payload->count(),
            'personnel'  => $payload,
        ], 200);
    }

    /**
     * Crée un nouveau membre du personnel.
     */
    public function storePersonnel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'nullable|string|min:6',
            'role'       => 'required|string|in:direction,chef_atelier,technicien',
            'telephone'  => 'nullable|string|max:50',
            'specialite' => 'nullable|string|max:255',
            'pont_id'    => 'nullable|exists:ponts,id',
            'is_active'  => 'nullable|boolean',
        ]);

        $validated['password'] = bcrypt($validated['password'] ?? 'AutoAbda2026!');
        $validated['is_active'] = $validated['is_active'] ?? true;

        $user = User::create($validated);

        return response()->json([
            'message'   => 'Membre du personnel créé avec succès.',
            'personnel' => $user->load('pont'),
        ], 201);
    }

    /**
     * Met à jour les informations d'un membre du personnel.
     * Libère automatiquement le pont en base de données si le membre devient inactif.
     */
    public function updatePersonnel(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $oldPontId = $user->pont_id;

        $validated = $request->validate([
            'name'       => 'sometimes|required|string|max:255',
            'email'      => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password'   => 'nullable|string|min:6',
            'role'       => 'sometimes|required|string|in:direction,chef_atelier,technicien',
            'telephone'  => 'nullable|string|max:50',
            'specialite' => 'nullable|string|max:255',
            'pont_id'    => 'nullable|exists:ponts,id',
            'is_active'  => 'sometimes|boolean',
        ]);

        // 🛑 Si le statut devient 'Inactif', désaffecter le pont et libérer l'équipement
        $isBecomingInactive = array_key_exists('is_active', $validated) && filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN) === false;

        if ($isBecomingInactive) {
            $validated['pont_id'] = null;

            if ($oldPontId) {
                Pont::where('id', $oldPontId)->update(['statut' => 'Libre']);
            }
        }

        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message'   => 'Informations du personnel mises à jour avec succès.',
            'personnel' => $user->load('pont'),
        ], 200);
    }

    /**
     * Supprime / Désactive un membre du personnel et libère son pont.
     */
    public function destroyPersonnel($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $oldPontId = $user->pont_id;

        // Libération du pont et passage du statut à inactif
        $user->update([
            'pont_id'   => null,
            'is_active' => false,
        ]);

        if ($oldPontId) {
            Pont::where('id', $oldPontId)->update(['statut' => 'Libre']);
        }

        $user->delete();

        return response()->json([
            'message' => 'Membre du personnel supprimé et pont libéré avec succès.',
        ], 200);
    }


    // =========================================================================
    // 2. GESTION DES INFRASTRUCTURES (PONTS DE L'ATELIER)
    // =========================================================================

    /**
     * Récupère la liste détaillée des ponts de l'atelier avec leur état.
     */
    public function indexPonts(Request $request): JsonResponse
    {
        $ponts = Pont::with(['users' => function ($q) {
            $q->where('is_active', true);
        }, 'interventions' => function ($query) {
            $query->whereIn('statut', ['En cours', 'Bloqué'])->with(['vehicule', 'user']);
        }])->orderBy('id')->get();

        $payload = $ponts->map(function ($pont) {
            $activeIntervention = $pont->interventions->first();
            $techniciens = $pont->users->map(fn($u) => [
                'id'  => $u->id,
                'nom' => $u->name,
            ]);

            return [
                'id'                   => $pont->id,
                'nom'                  => $pont->nom,
                'statut'               => $pont->statut, // Libre, Occupé, Maintenance
                'est_en_maintenance'   => strtolower($pont->statut) === 'maintenance',
                'techniciens_assignes' => $techniciens,
                'intervention_active'  => $activeIntervention ? [
                    'id'                => $activeIntervention->id,
                    'type_intervention' => $activeIntervention->type_intervention,
                    'statut'            => $activeIntervention->statut,
                    'vehicule'          => $activeIntervention->vehicule ? ($activeIntervention->vehicule->marque . ' ' . $activeIntervention->vehicule->modele) : null,
                    'technicien'        => $activeIntervention->user?->name,
                ] : null,
            ];
        });

        return response()->json([
            'message' => 'Liste des ponts et équipements récupérée avec succès.',
            'total'   => $payload->count(),
            'ponts'   => $payload,
        ], 200);
    }

    /**
     * Récupère la liste des ponts actuellement libres.
     */
    public function indexPontsLibres(Request $request): JsonResponse
    {
        $ponts = Pont::where('statut', 'Libre')->orderBy('id')->get();

        return response()->json([
            'message' => 'Liste des ponts libres récupérée avec succès.',
            'total'   => $ponts->count(),
            'ponts'   => $ponts,
        ], 200);
    }

    /**
     * Verrouille ou met à jour le statut d'un pont (ex: Maintenance / Libre).
     */
    public function updatePontStatus(Request $request, $id): JsonResponse
    {
        $pont = Pont::findOrFail($id);

        $validated = $request->validate([
            'statut' => 'required|string|in:Libre,Occupé,Maintenance,En maintenance',
        ]);

        // Standardisation
        $statutNormalise = strtolower($validated['statut']) === 'en maintenance' ? 'Maintenance' : ucfirst($validated['statut']);

        $pont->update(['statut' => $statutNormalise]);

        return response()->json([
            'message' => "Le statut du {$pont->nom} a été mis à jour avec succès : {$statutNormalise}.",
            'pont'    => [
                'id'     => $pont->id,
                'nom'    => $pont->nom,
                'statut' => $pont->statut,
            ],
        ], 200);
    }
}
