<?php

namespace App\Http\Controllers\Api;

use App\Events\InterventionStatusChanged;
use App\Events\TicketStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Prestation;
use App\Models\User;
use App\Models\Vehicule;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InterventionController extends Controller
{
    /**
     * Mettre à jour les informations complètes d'une intervention (Réception & Chef d'atelier).
     * PUT /api/interventions/{id}
     * PUT /api/direction/interventions/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $intervention = Intervention::with(['vehicule.prestations', 'technicien', 'pont', 'user'])->findOrFail($id);

        $request->validate([
            'immatriculation'  => 'nullable|string|max:50',
            'matricule'        => 'nullable|string|max:50',
            'marque'           => 'nullable|string|max:100',
            'modele'           => 'nullable|string|max:100',
            'vehicule'         => 'nullable',
            'client_nom'       => 'nullable|string|max:150',
            'client_telephone' => 'nullable|string|max:50',
            'client'           => 'nullable|array',
            'technicien_id'    => 'nullable|exists:users,id',
            'user_id'          => 'nullable|exists:users,id',
            'interventions'    => 'nullable|array',
            'catalogue_ids'    => 'nullable|array',
            'prestations'      => 'nullable|array',
            'type_intervention'=> 'nullable|string',
            'motif_blocage'    => 'nullable|string|max:1000',
            'is_rdv'           => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($intervention, $request) {
            // ── 1. Mise à jour du Véhicule & Client ──────────────────────────
            $vehicule = $intervention->vehicule;

            if ($vehicule) {
                // Immatriculation
                $newMatricule = $request->input('immatriculation') ?? $request->input('matricule');
                if ($newMatricule) {
                    $vehicule->matricule = strtoupper(trim($newMatricule));
                }

                // Marque / Modèle
                if ($request->filled('marque')) {
                    $vehicule->marque = trim($request->input('marque'));
                }
                if ($request->filled('modele')) {
                    $vehicule->modele = trim($request->input('modele'));
                } elseif (is_string($request->input('vehicule')) && !empty($request->input('vehicule'))) {
                    $parts = explode(' ', trim($request->input('vehicule')), 2);
                    $vehicule->marque = $parts[0];
                    if (isset($parts[1])) {
                        $vehicule->modele = $parts[1];
                    }
                }

                // Nom & Téléphone / Contact Client
                $clientNom = $request->input('client_nom') ?? $request->input('client.nom');
                if ($clientNom !== null) {
                    $vehicule->client_nom = trim($clientNom);
                }

                $clientTel = $request->input('client_telephone') ?? $request->input('client.telephone') ?? $request->input('client.contact');
                if ($clientTel !== null) {
                    $vehicule->client_telephone = trim($clientTel);
                }

                $vehicule->save();
            }

            // ── 2. Logique critique : Prestations & Recalcul du Temps Barémé ──
            // Interrogation directe de la table du catalogue pour garantir l'exactitude des primes
            $rawPrestations = $request->input('interventions') 
                ?? $request->input('catalogue_ids') 
                ?? $request->input('prestations');

            if ($rawPrestations !== null && is_array($rawPrestations)) {
                // 🛑 DÉDUPLICATION STRICTE des IDs / noms reçus du front-end
                $prestationsIdsOrNames = array_values(array_unique(array_filter($rawPrestations)));

                $prestations = Prestation::whereIn('id', $prestationsIdsOrNames)
                    ->orWhereIn('nom', $prestationsIdsOrNames)
                    ->get();

                if ($prestations->isNotEmpty()) {
                    // Calcul du temps barémé total depuis la table prestations
                    $nouveauTempsBareme = (int) $prestations->sum('temps_bareme');
                    if ($nouveauTempsBareme <= 0) {
                        $nouveauTempsBareme = 60;
                    }

                    $intervention->temps_bareme = $nouveauTempsBareme;
                    $intervention->type_intervention = implode(', ', array_values(array_unique($prestations->pluck('nom')->toArray())));

                    // 🛑 Synchronisation stricte de la table pivot avec array_unique()
                    if ($vehicule) {
                        $uniquePrestationIds = array_values(array_unique($prestations->pluck('id')->toArray()));
                        $vehicule->prestations()->sync($uniquePrestationIds);
                    }
                }
            } elseif ($request->filled('type_intervention')) {
                $typeStr = $request->input('type_intervention');
                $parts = array_values(array_unique(array_filter(array_map('trim', explode(',', $typeStr)))));
                $prestations = Prestation::whereIn('nom', $parts)->orWhereIn('id', $parts)->get();

                if ($prestations->isNotEmpty()) {
                    $nouveauTempsBareme = (int) $prestations->sum('temps_bareme');
                    $intervention->temps_bareme = $nouveauTempsBareme > 0 ? $nouveauTempsBareme : 60;
                    $intervention->type_intervention = implode(', ', array_values(array_unique($prestations->pluck('nom')->toArray())));

                    if ($vehicule) {
                        $uniquePrestationIds = array_values(array_unique($prestations->pluck('id')->toArray()));
                        $vehicule->prestations()->sync($uniquePrestationIds);
                    }
                } else {
                    $intervention->type_intervention = implode(', ', $parts);
                }
            }

            // ── 3. Réattribution du Technicien ──────────────────────────────
            $newTechId = $request->input('technicien_id') ?? $request->input('user_id');
            if ($newTechId !== null) {
                $intervention->user_id = !empty($newTechId) ? $newTechId : null;
            }

            // ── 4. Autres champs optionnels ─────────────────────────────────
            if ($request->has('motif_blocage')) {
                $intervention->motif_blocage = $request->input('motif_blocage');
            }
            if ($request->has('is_rdv')) {
                $intervention->is_rdv = (bool) $request->input('is_rdv');
            }

            $intervention->save();
        });

        // ── 5. Rechargement des relations pour synchronisation complète ───
        $intervention->refresh();
        $intervention->load(['vehicule.prestations', 'technicien', 'user', 'pont']);

        // ── 6. Diffusion temps réel Reverb (Atelier + Garage) ──────────────
        broadcast(new InterventionStatusChanged($intervention));
        broadcast(new TicketStatusUpdated($intervention));

        // Formatage pour l'interface Réception & Chef
        $nomVehicule = $intervention->vehicule 
            ? trim("{$intervention->vehicule->marque} {$intervention->vehicule->modele}")
            : 'Inconnu';

        $interventionsList = $intervention->vehicule && $intervention->vehicule->prestations->isNotEmpty()
            ? $intervention->vehicule->prestations->pluck('nom')->toArray()
            : array_values(array_filter(explode(', ', $intervention->type_intervention ?? '')));

        return response()->json([
            'status'       => 'success',
            'message'      => 'Intervention et barème mis à jour avec succès.',
            'intervention' => $intervention,
            'ticket'       => [
                'id'               => $intervention->id,
                'immat'            => $intervention->vehicule ? $intervention->vehicule->matricule : 'INCONNU',
                'immatriculation'  => $intervention->vehicule ? $intervention->vehicule->matricule : 'INCONNU',
                'marque'           => $nomVehicule,
                'client_nom'       => $intervention->vehicule?->client_nom,
                'client_telephone' => $intervention->vehicule?->client_telephone,
                'client'           => [
                    'nom'       => $intervention->vehicule?->client_nom ?? '',
                    'telephone' => $intervention->vehicule?->client_telephone ?? '',
                ],
                'interventions'    => $interventionsList,
                'type_intervention'=> $intervention->type_intervention,
                'temps_bareme'     => $intervention->temps_bareme,
                'temps_bareme_total'=> $intervention->temps_bareme_total,
                'rdv'              => (bool) ($intervention->is_rdv ?? false),
                'heure'            => $intervention->created_at ? $intervention->created_at->format('H:i') : date('H:i'),
                'statut'           => $intervention->statut,
                'motif_blocage'    => $intervention->motif_blocage,
                'technicien'       => $intervention->technicien ? [
                    'id'   => $intervention->technicien->id,
                    'nom'  => $intervention->technicien->name,
                    'name' => $intervention->technicien->name,
                ] : null,
                'pont'             => $intervention->pont ? [
                    'id'  => $intervention->pont->id,
                    'nom' => $intervention->pont->nom,
                ] : null,
            ],
        ], 200);
    }

    /**
     * Obtenir les détails d'une intervention.
     * GET /api/interventions/{id}
     * GET /api/tickets/{id}
     */
    public function show($id): JsonResponse
    {
        $intervention = Intervention::with(['vehicule.prestations', 'technicien', 'user', 'pont'])->findOrFail($id);

        $nomVehicule = $intervention->vehicule 
            ? trim("{$intervention->vehicule->marque} {$intervention->vehicule->modele}")
            : 'Inconnu';

        $interventionsList = $intervention->vehicule && $intervention->vehicule->prestations->isNotEmpty()
            ? $intervention->vehicule->prestations->pluck('nom')->toArray()
            : array_values(array_filter(explode(', ', $intervention->type_intervention ?? '')));

        return response()->json([
            'status'       => 'success',
            'intervention' => $intervention,
            'ticket'       => [
                'id'               => $intervention->id,
                'immat'            => $intervention->vehicule ? $intervention->vehicule->matricule : 'INCONNU',
                'immatriculation'  => $intervention->vehicule ? $intervention->vehicule->matricule : 'INCONNU',
                'marque'           => $nomVehicule,
                'vehicule'         => $intervention->vehicule,
                'client_nom'       => $intervention->vehicule?->client_nom,
                'client_telephone' => $intervention->vehicule?->client_telephone,
                'client'           => [
                    'nom'       => $intervention->vehicule?->client_nom ?? '',
                    'telephone' => $intervention->vehicule?->client_telephone ?? '',
                ],
                'interventions'    => $interventionsList,
                'type_intervention'=> $intervention->type_intervention,
                'temps_bareme'     => $intervention->temps_bareme,
                'temps_bareme_total'=> $intervention->temps_bareme_total,
                'rdv'              => (bool) ($intervention->is_rdv ?? false),
                'heure'            => $intervention->created_at ? $intervention->created_at->format('H:i') : date('H:i'),
                'statut'           => $intervention->statut,
                'motif_blocage'    => $intervention->motif_blocage,
                'technicien'       => $intervention->technicien ? [
                    'id'   => $intervention->technicien->id,
                    'nom'  => $intervention->technicien->name,
                    'name' => $intervention->technicien->name,
                ] : null,
                'pont'             => $intervention->pont ? [
                    'id'  => $intervention->pont->id,
                    'nom' => $intervention->pont->nom,
                ] : null,
            ],
        ], 200);
    }

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
