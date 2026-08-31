<?php

namespace App\Http\Controllers\Api;

use App\Events\NewVehicleArrived;
use App\Events\TicketCreated;
use App\Events\TicketDeleted;
use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Pont;
use App\Models\Prestation;
use App\Models\User;
use App\Models\Vehicule;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReceptionController extends Controller
{
    /**
     * Obtenir le catalogue des prestations & barèmes pour le module Réception.
     * GET /api/reception/catalogue
     */
    public function getInterventions(): JsonResponse
    {
        $prestations = Prestation::select('id', 'nom', 'categorie', 'temps_bareme', 'tarif')
            ->orderBy('nom', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'id'               => $item->id,
                    'nom'              => $item->nom,
                    'nom_intervention' => $item->nom,
                    'categorie'        => $item->categorie,
                    'temps_bareme'     => (int) $item->temps_bareme,
                    'tarif'            => (float) $item->tarif,
                ];
            });

        return response()->json([
            'status'        => 'success',
            'interventions' => $prestations,
            'catalogue'     => $prestations,
        ], 200);
    }

    /**
     * Obtenir la liste des véhicules / tickets en attente.
     * Trié par priorité RDV (is_rdv desc) puis par ordre d'arrivée FIFO (created_at asc).
     */
    /**
     * Obtenir la liste des véhicules / tickets en attente et en cours.
     * Trié par priorité d'activité ('en_attente' => 1, 'en_cours' => 2, 'bloqué' => 3, 'terminé' => 4)
     */
    public function getTickets(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 10);
        $page = (int) $request->query('page', 1);

        $query = Intervention::with(['vehicule.prestations', 'technicien', 'pont'])
            ->whereDate('created_at', Carbon::today())
            ->whereIn(DB::raw('LOWER(statut)'), [
                'en cours', 'en_cours',
                'en attente', 'en_attente',
                'bloqué', 'bloque',
            ])
            ->orderByRaw("CASE
                WHEN LOWER(statut) IN ('en cours', 'en_cours') THEN 1
                WHEN LOWER(statut) IN ('bloqué', 'bloque')    THEN 2
                WHEN LOWER(statut) IN ('en attente', 'en_attente') THEN 3
                ELSE 4 END")
            ->orderByRaw("COALESCE(is_rdv, 0) DESC")
            ->orderBy('created_at', 'asc');

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $tickets = collect($paginator->items())->map(function ($item) {
            $interventionsList = $item->vehicule && $item->vehicule->prestations->isNotEmpty()
                ? $item->vehicule->prestations->pluck('nom')->toArray()
                : (explode(', ', $item->type_intervention ?? ''));

            $nomVehicule = $item->vehicule 
                ? trim("{$item->vehicule->marque} {$item->vehicule->modele}")
                : 'Inconnu';

            $rawStatut = $item->statut ?? 'En attente';
            $normalizedStatut = match(strtolower($rawStatut)) {
                'en cours', 'en_cours' => 'En cours',
                'bloqué', 'bloque'     => 'Bloqué',
                'terminé', 'termine'   => 'Terminé',
                default                => 'En attente',
            };

            return [
                'id'            => $item->id,
                'immat'         => $item->vehicule ? $item->vehicule->matricule : 'INCONNU',
                'marque'        => $nomVehicule,
                'interventions' => array_values(array_filter($interventionsList)),
                'rdv'           => (bool) ($item->is_rdv ?? false),
                'heure'         => $item->created_at ? $item->created_at->format('H:i') : date('H:i'),
                'statut'        => $normalizedStatut,
                'technicien'    => $item->technicien ? [
                    'id'   => $item->technicien->id,
                    'nom'  => $item->technicien->name,
                    'name' => $item->technicien->name,
                ] : null,
                'pont'          => $item->pont ? [
                    'id'  => $item->pont->id,
                    'nom' => $item->pont->nom,
                ] : null,
            ];
        });

        return response()->json([
            'status'       => 'success',
            'tickets'      => $tickets,
            'vehicules'    => $tickets,
            'data'         => $tickets,
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'per_page'     => $paginator->perPage(),
            'total'        => $paginator->total(),
            'pagination'   => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    /**
     * Obtenir la file d'attente complète & le suivi temps réel pour le module Réception avec pagination.
     * GET /api/reception/file-attente
     */
    public function getFileAttente(Request $request): JsonResponse
    {
        $perPage    = (int) $request->query('per_page', 10);
        $page       = (int) $request->query('page', 1);
        $activeOnly = filter_var($request->query('active_only', false), FILTER_VALIDATE_BOOLEAN);

        // ── Statuts inclus dans la liste paginée ────────────────────────────────
        $activeStatuts = ['en cours', 'en_cours', 'en attente', 'en_attente', 'bloqué', 'bloque'];
        $allStatuts    = array_merge($activeStatuts, ['terminé', 'termine']);

        $statuts = $activeOnly ? $activeStatuts : $allStatuts;

        // ── Requête principale (paginée) ─────────────────────────────────────────
        $query = Intervention::with(['vehicule.prestations', 'technicien', 'pont'])
            ->whereDate('created_at', Carbon::today())
            ->whereIn(DB::raw('LOWER(statut)'), $statuts)
            ->orderByRaw("CASE
                WHEN LOWER(statut) IN ('en cours', 'en_cours') THEN 1
                WHEN LOWER(statut) IN ('bloqué', 'bloque')    THEN 2
                WHEN LOWER(statut) IN ('en attente', 'en_attente') THEN 3
                ELSE 4 END")
            ->orderByRaw("COALESCE(is_rdv, 0) DESC")
            ->orderBy('created_at', 'asc');

        // ── Compteurs KPIs (toujours sur l'ensemble du jour courant) ──
        $enAttenteCount = Intervention::whereDate('created_at', Carbon::today())
            ->whereIn(DB::raw('LOWER(statut)'), ['en attente', 'en_attente'])
            ->count();
        $enCoursCount   = Intervention::whereDate('created_at', Carbon::today())
            ->whereIn(DB::raw('LOWER(statut)'), ['en cours', 'en_cours', 'bloqué', 'bloque'])
            ->count();
        $terminesCount  = Intervention::whereDate('created_at', Carbon::today())
            ->whereIn(DB::raw('LOWER(statut)'), ['terminé', 'termine'])
            ->count();
        $totalCount     = $enAttenteCount + $enCoursCount + $terminesCount;

        // ── Pagination ───────────────────────────────────────────────────────────
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $vehicules = collect($paginator->items())->map(function ($item) {
            $interventionsList = $item->vehicule && $item->vehicule->prestations->isNotEmpty()
                ? $item->vehicule->prestations->pluck('nom')->toArray()
                : (explode(', ', $item->type_intervention ?? ''));

            $nomVehicule = $item->vehicule 
                ? trim("{$item->vehicule->marque} {$item->vehicule->modele}")
                : 'Inconnu';

            $rawStatut = $item->statut ?? 'En attente';
            $normalizedStatut = match(strtolower($rawStatut)) {
                'en cours', 'en_cours' => 'En cours',
                'bloqué', 'bloque'     => 'Bloqué',
                'terminé', 'termine'   => 'Terminé',
                default                => 'En attente',
            };

            return [
                'id'            => $item->id,
                'immat'         => $item->vehicule ? $item->vehicule->matricule : 'INCONNU',
                'marque'        => $nomVehicule,
                'interventions' => array_values(array_filter($interventionsList)),
                'rdv'           => (bool) ($item->is_rdv ?? false),
                'heure'         => $item->created_at ? $item->created_at->format('H:i') : date('H:i'),
                'statut'        => $normalizedStatut,
                'technicien'    => $item->technicien ? [
                    'id'   => $item->technicien->id,
                    'nom'  => $item->technicien->name,
                    'name' => $item->technicien->name,
                ] : null,
                'pont'          => $item->pont ? [
                    'id'  => $item->pont->id,
                    'nom' => $item->pont->nom,
                ] : null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'kpis'   => [
                'total'      => $totalCount,
                'en_attente' => $enAttenteCount,
                'en_cours'   => $enCoursCount,
                'termines'   => $terminesCount,
            ],
            'vehicules'    => $vehicules,
            'tickets'      => $vehicules,
            'data'         => $vehicules,
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'per_page'     => $paginator->perPage(),
            'total'        => $paginator->total(),
            'pagination'   => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    /**
     * Recherche d'historique de véhicules avec filtres temporels & immatriculation.
     * GET /api/reception/historique
     */
    public function getHistorique(Request $request): JsonResponse
    {
        $plaque = $request->query('plaque') ?? $request->query('search');
        $jour   = $request->query('jour');
        $mois   = $request->query('mois');
        $annee  = $request->query('annee');

        $query = Vehicule::withCount('interventions as tickets_count')
            ->with(['interventions.technicien', 'interventions.pont', 'prestations']);

        // Filtre conditionnel sur la plaque d'immatriculation
        if ($plaque) {
            $query->where('matricule', 'LIKE', '%' . trim($plaque) . '%');
        }

        // Filtres conditionnels sur les dates de création des tickets / interventions associées
        if ($jour || $mois || $annee) {
            $query->whereHas('interventions', function ($q) use ($jour, $mois, $annee) {
                if ($annee) {
                    $q->whereYear('created_at', $annee);
                }
                if ($mois) {
                    $q->whereMonth('created_at', $mois);
                }
                if ($jour) {
                    $q->whereDay('created_at', $jour);
                }
            });
        }

        $vehicules = $query->orderBy('updated_at', 'desc')->get()->map(function ($v) {
            return [
                'id'                  => $v->id,
                'immatriculation'     => $v->matricule,
                'matricule'           => $v->matricule,
                'marque'              => trim("{$v->marque} {$v->modele}"),
                'tickets_count'       => $v->tickets_count,
                'interventions_count' => $v->tickets_count,
                'client_nom'          => $v->client_nom ?? 'Client Particulier',
                'client_telephone'    => $v->client_telephone ?? 'Non renseigné',
                'interventions'       => $v->interventions->map(function ($item) {
                    return [
                        'id'                => $item->id,
                        'type_intervention' => $item->type_intervention,
                        'statut'            => $item->statut,
                        'created_at'        => $item->created_at ? $item->created_at->format('Y-m-d H:i') : null,
                        'technicien_id'     => $item->user_id ?? $item->technicien?->id,
                        'technicien'        => $item->technicien ? [
                            'id'   => $item->technicien->id,
                            'nom'  => $item->technicien->name,
                            'name' => $item->technicien->name,
                        ] : ($item->user ? [
                            'id'   => $item->user->id,
                            'nom'  => $item->user->name,
                            'name' => $item->user->name,
                        ] : null),
                        'technicien_nom'    => $item->technicien?->name ?? $item->user?->name ?? 'Non assigné',
                        'est_retour_sav'    => (bool) ($item->est_retour_sav ?? false),
                        'pont'              => $item->pont ? $item->pont->nom : 'Non affecté',
                    ];
                }),
            ];
        });

        return response()->json([
            'status'    => 'success',
            'count'     => $vehicules->count(),
            'vehicules' => $vehicules,
        ], 200);
    }

    /**
     * Nouvelle route GET /techniciens-disponibles : Retourne la liste des techniciens actifs pour le choix manuel.
     */
    /**
     * Route GET /techniciens-disponibles : Retourne la liste des techniciens actifs et le statut de leur pont.
     */
    public function getTechniciensDisponibles(): JsonResponse
    {
        $techniciens = User::where('role', 'technicien')
            ->where('is_active', true)
            ->with('pont')
            ->select('id', 'name', 'email', 'specialite', 'pont_id')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($tech) {
                $pontStatut = $tech->pont ? strtolower($tech->pont->statut) : 'libre';
                $isMaintenance = str_contains($pontStatut, 'maint') || str_contains($pontStatut, 'hors');
                return [
                    'id'             => $tech->id,
                    'nom'            => $tech->name,
                    'name'           => $tech->name,
                    'specialite'     => $tech->specialite ?? 'Mécanique Générale',
                    'pont_id'        => $tech->pont_id,
                    'pont_nom'       => $tech->pont?->nom,
                    'pont_statut'    => $tech->pont?->statut,
                    'is_maintenance' => $isMaintenance,
                ];
            });

        return response()->json([
            'status'      => 'success',
            'techniciens' => $techniciens,
        ]);
    }

    /**
     * Enregistrer un nouveau véhicule / ticket en file d'attente.
     * Algorithme d'attribution intelligente ('auto' Load Balancing excluant la maintenance ou 'manuel' avec validation HTTP 422).
     */
    public function storeTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'immatriculation'  => 'required|string|max:50',
            'marque'           => 'required|string|max:100',
            'is_rdv'           => 'nullable|boolean',
            'est_retour_sav'   => 'nullable|boolean',
            'interventions'    => 'required|array|min:1',
            'interventions.*'  => 'required|integer|exists:prestations,id',
            'mode_attribution' => 'nullable|string|in:auto,manuel',
            'technicien_id'    => 'required_if:mode_attribution,manuel|nullable|exists:users,id',
        ]);

        $matricule = strtoupper(trim($validated['immatriculation']));
        $marqueInput = trim($validated['marque']);
        $isRdv = (bool) ($validated['is_rdv'] ?? false);
        $estRetourSav = (bool) ($validated['est_retour_sav'] ?? false);

        // 🛑 SÉCURITÉ DOUBLE TICKET : Interdire la création si le véhicule possède une intervention active
        $existingActiveIntervention = Intervention::whereHas('vehicule', function ($q) use ($matricule) {
                $q->where('matricule', $matricule);
            })
            ->whereIn(DB::raw('LOWER(statut)'), [
                'en attente', 'en_attente',
                'en cours', 'en_cours',
                'en pause', 'en_pause', 'pause',
                'bloqué', 'bloque'
            ])
            ->first();

        if ($existingActiveIntervention) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Impossible de créer le ticket : ce véhicule est déjà en attente ou en cours de traitement.',
                'errors'  => [
                    'immatriculation' => ['Impossible de créer le ticket : ce véhicule est déjà en attente ou en cours de traitement.'],
                ],
            ], 422);
        }

        // Extraire la marque et le modèle sans texte ni modèle par défaut forcé
        $parts = explode(' ', $marqueInput, 2);
        $marque = $parts[0];
        $modele = $parts[1] ?? '';

        // 1. Enregistrer ou récupérer le véhicule
        $vehicule = Vehicule::firstOrCreate(
            ['matricule' => $matricule],
            [
                'marque' => $marque,
                'modele' => $modele,
            ]
        );

        $interventionsList = $validated['interventions'] ?? $request->input('interventions', []);

        // 2. Récupérer les prestations réelles depuis le catalogue DB via ID ou Nom
        $prestations = Prestation::whereIn('id', $interventionsList)
            ->orWhereIn('nom', $interventionsList)
            ->get();

        $prestationIds   = $prestations->pluck('id')->toArray();
        $prestationNames = $prestations->pluck('nom')->toArray();

        // Attachement strict dans la table pivot Many-to-Many
        if (!empty($prestationIds)) {
            $vehicule->prestations()->syncWithoutDetaching($prestationIds);
        }

        // Formater les prestations sous forme textuelle pour affichage rapide
        $typeInterventionLabel = !empty($prestationNames)
            ? implode(', ', $prestationNames)
            : implode(', ', $interventionsList);

        // 3. Algorithme d'attribution intelligente du véhicule au technicien
        $modeAttribution = $validated['mode_attribution'] ?? 'auto';
        $technicienId = null;

        if ($modeAttribution === 'manuel') {
            $technicienId = $validated['technicien_id'];

            // 🛑 Validation stricte : Vérifier que le pont du technicien n'est pas en maintenance
            $selectedTech = User::with('pont')->find($technicienId);
            if ($selectedTech && $selectedTech->pont) {
                $st = strtolower($selectedTech->pont->statut ?? '');
                if (str_contains($st, 'maint') || str_contains($st, 'hors')) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'Impossible d\'affecter un véhicule : le pont de ce technicien est en maintenance.',
                        'errors'  => [
                            'technicien' => ['Impossible d\'affecter un véhicule : le pont de ce technicien est en maintenance.'],
                        ],
                    ], 422);
                }
            }
        } else {
            // 🛑 Mode Auto (Load Balancing) : Exclure formellement les techniciens dont le pont est en maintenance
            $technicienMoinsCharge = User::where('role', 'technicien')
                ->where('is_active', true)
                ->where(function ($query) {
                    $query->whereNull('pont_id')
                        ->orWhereHas('pont', function ($q) {
                            $q->whereRaw("LOWER(statut) NOT LIKE '%maint%'")
                              ->whereRaw("LOWER(statut) NOT LIKE '%hors%'");
                        });
                })
                ->withCount(['interventions' => function ($query) {
                    $query->whereIn('statut', ['En attente', 'En cours']);
                }])
                ->orderBy('interventions_count', 'asc')
                ->first();

            if ($technicienMoinsCharge) {
                $technicienId = $technicienMoinsCharge->id;
            }
        }

        // 4. Créer le ticket d'intervention
        $intervention = Intervention::create([
            'vehicule_id'       => $vehicule->id,
            'user_id'           => $technicienId,
            'pont_id'           => null,
            'type_intervention' => $typeInterventionLabel,
            'statut'            => 'En attente',
            'is_rdv'            => $isRdv,
            'est_retour_sav'    => $estRetourSav,
        ]);

        // 5. Charger les relations du ticket (technicien, prestations via vehicule)
        $intervention->load(['technicien', 'vehicule.prestations']);

        // 6. Déclencher les événements Temps Réel Reverb immédiats
        broadcast(new TicketCreated($intervention));
        broadcast(new NewVehicleArrived($intervention));

        $heureArrivee = $intervention->created_at ? $intervention->created_at->format('H:i') : date('H:i');
        $nomMarqueModele = trim("{$vehicule->marque} {$vehicule->modele}");

        $displayInterventions = !empty($prestationNames) ? $prestationNames : $interventionsList;

        return response()->json([
            'status'  => 'success',
            'message' => 'Ticket enregistré avec succès et transmis à l\'atelier.',
            'ticket'  => [
                'id'               => $intervention->id,
                'immat'            => $vehicule->matricule,
                'marque'           => $nomMarqueModele,
                'interventions'    => $displayInterventions,
                'rdv'              => $isRdv,
                'heure'            => $heureArrivee,
                'statut'           => $intervention->statut,
                'mode_attribution' => $modeAttribution,
                'technicien_id'    => $technicienId,
                'technicien'       => $intervention->technicien ? [
                    'id'   => $intervention->technicien->id,
                    'nom'  => $intervention->technicien->name,
                    'name' => $intervention->technicien->name,
                ] : null,
            ],
            'intervention' => $intervention,
        ], 201);
    }

    /**
     * Supprimer définitivement un ticket / intervention et diffuser l'événement temps réel TicketDeleted.
     * Nettoie les relations (pont, prestations pivot) pour éviter toute contrainte de clé étrangère.
     * DELETE /api/reception/tickets/{id}
     */
    public function destroyTicket($id): JsonResponse
    {
        try {
            $intervention = Intervention::find($id);

            if (!$intervention) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Ticket introuvable ou déjà supprimé.',
                ], 404);
            }

            $ticketId = (int) $intervention->id;

            DB::transaction(function () use ($intervention) {
                // 1. Libérer le pont si l'intervention y était active ('En cours')
                if ($intervention->pont_id) {
                    $pont = Pont::find($intervention->pont_id);
                    if ($pont && $intervention->statut === 'En cours') {
                        $pont->update(['statut' => 'Libre']);
                    }
                }

                // 2. Détacher les relations pivot (prestation_vehicule) pour éviter des erreurs de clés étrangères
                if ($intervention->vehicule) {
                    $otherCount = Intervention::where('vehicule_id', $intervention->vehicule_id)
                        ->where('id', '!=', $intervention->id)
                        ->count();

                    if ($otherCount === 0) {
                        $intervention->vehicule->prestations()->detach();
                    }
                }

                // 3. Suppression réelle en base de données (forceDelete si SoftDeletes est présent, sinon delete)
                if (method_exists($intervention, 'forceDelete')) {
                    $intervention->forceDelete();
                } else {
                    $intervention->delete();
                }
            });

            // 4. Diffusion de l'événement temps réel via Laravel Reverb
            broadcast(new TicketDeleted($ticketId));

            return response()->json([
                'status'    => 'success',
                'message'   => 'Ticket supprimé réellement en base de données.',
                'ticket_id' => $ticketId,
            ], 200);

        } catch (\Throwable $e) {
            Log::error("Erreur lors de la suppression du ticket ID {$id} : " . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'La suppression a échoué côté serveur : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les détails complets d'un ticket / intervention pour l'impression.
     * GET /api/tickets/{id} ou /api/reception/tickets/{id}
     */
    public function showTicket($id): JsonResponse
    {
        $intervention = Intervention::with(['vehicule.prestations', 'technicien', 'pont'])->find($id);

        if (!$intervention) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Ticket introuvable.',
            ], 404);
        }

        $interventionsList = $intervention->vehicule && $intervention->vehicule->prestations->isNotEmpty()
            ? $intervention->vehicule->prestations->pluck('nom')->toArray()
            : (explode(', ', $intervention->type_intervention ?? ''));

        $nomVehicule = $intervention->vehicule 
            ? trim("{$intervention->vehicule->marque} {$intervention->vehicule->modele}")
            : 'Inconnu';

        $ticketData = [
            'id'            => $intervention->id,
            'immat'         => $intervention->vehicule ? $intervention->vehicule->matricule : 'INCONNU',
            'marque'        => $nomVehicule,
            'client_nom'    => $intervention->vehicule->client_nom ?? 'Client Passage',
            'client_phone'  => $intervention->vehicule->client_telephone ?? '-',
            'interventions' => array_values(array_filter($interventionsList)),
            'rdv'           => (bool) ($intervention->is_rdv ?? false),
            'date_creation' => $intervention->created_at ? $intervention->created_at->format('d/m/Y H:i') : date('d/m/Y H:i'),
            'heure'         => $intervention->created_at ? $intervention->created_at->format('H:i') : date('H:i'),
            'statut'        => $intervention->statut,
            'technicien'    => $intervention->technicien ? [
                'id'   => $intervention->technicien->id,
                'nom'  => $intervention->technicien->name,
                'name' => $intervention->technicien->name,
            ] : null,
            'pont'          => $intervention->pont ? [
                'id'  => $intervention->pont->id,
                'nom' => $intervention->pont->nom,
            ] : null,
        ];

        return response()->json([
            'status' => 'success',
            'ticket' => $ticketData,
            'data'   => $ticketData,
        ], 200);
    }

    /**
     * Rechercher si une immatriculation existe déjà dans la base.
     * GET /api/reception/vehicules/search?plaque=XX-123-YY
     */
    public function searchVehicule(Request $request): JsonResponse
    {
        $plaque = strtoupper(trim($request->query('plaque') ?? $request->query('immatriculation') ?? $request->query('matricule') ?? ''));

        if (empty($plaque)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'L\'immatriculation est requise pour la recherche.',
                'found'   => false,
            ], 422);
        }

        // Rechercher le véhicule par immatriculation/matricule
        $vehicule = Vehicule::where(DB::raw('UPPER(matricule)'), $plaque)
            ->with(['interventions' => function ($q) {
                $q->orderBy('created_at', 'desc');
            }])
            ->first();

        if (!$vehicule) {
            return response()->json([
                'status'   => 'success',
                'found'    => false,
                'message'  => 'Aucun véhicule trouvé pour cette immatriculation.',
                'vehicule' => null,
            ], 200);
        }

        // Si le véhicule existe, récupérer les infos du véhicule et du client
        $derniereIntervention = $vehicule->interventions->first();

        $clientNom = $vehicule->client_nom 
            ?? ($derniereIntervention ? $derniereIntervention->client_nom : null);
        $clientPhone = $vehicule->client_telephone 
            ?? ($derniereIntervention ? $derniereIntervention->client_telephone : null);

        return response()->json([
            'status'   => 'success',
            'found'    => true,
            'message'  => 'Véhicule trouvé.',
            'vehicule' => [
                'id'               => $vehicule->id,
                'matricule'        => $vehicule->matricule,
                'marque'           => $vehicule->marque,
                'modele'           => $vehicule->modele,
                'nom_complet'      => trim("{$vehicule->marque} {$vehicule->modele}"),
                'client_nom'       => $clientNom ?? 'Client Enregistré',
                'client_telephone' => $clientPhone ?? 'Non renseigné',
            ],
        ], 200);
    }

    /**
     * Récupérer l'historique complet des passages d'un véhicule par immatriculation.
     * GET /api/reception/vehicules/{immatriculation}/historique
     */
    public function getVehiculeHistorique(Request $request, $immatriculation): JsonResponse
    {
        $matricule = strtoupper(trim($immatriculation));

        if (empty($matricule)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Immatriculation invalide.',
            ], 422);
        }

        // Récupérer le véhicule si présent
        $vehicule = Vehicule::where(DB::raw('UPPER(matricule)'), $matricule)->first();

        // Récupérer toutes les interventions pour cette immatriculation (triées par date décroissante)
        $interventions = Intervention::whereHas('vehicule', function ($q) use ($matricule) {
                $q->where(DB::raw('UPPER(matricule)'), $matricule);
            })
            ->with(['vehicule.prestations', 'technicien', 'pont', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();

        $historique = $interventions->map(function ($item) {
            $prestationsList = $item->vehicule && $item->vehicule->prestations->isNotEmpty()
                ? $item->vehicule->prestations->pluck('nom')->toArray()
                : (explode(', ', $item->type_intervention ?? ''));

            $nomVehicule = $item->vehicule 
                ? trim("{$item->vehicule->marque} {$item->vehicule->modele}")
                : 'Véhicule Inconnu';

            $rawStatut = $item->statut ?? 'En attente';
            $normalizedStatut = match(strtolower($rawStatut)) {
                'en cours', 'en_cours' => 'En cours',
                'bloqué', 'bloque'     => 'Bloqué',
                'terminé', 'termine'   => 'Terminé',
                default                => 'En attente',
            };

            return [
                'id'                => $item->id,
                'created_at'        => $item->created_at ? $item->created_at->toIso8601String() : null,
                'date_passage'      => $item->created_at ? $item->created_at->format('d/m/Y') : '-',
                'heure_arrivee'     => $item->created_at ? $item->created_at->format('H:i') : '-',
                'date_debut'        => $item->date_debut ? $item->date_debut->format('d/m/Y H:i') : null,
                'heure_debut'       => $item->date_debut ? $item->date_debut->format('H:i') : null,
                'date_fin'          => $item->date_fin ? $item->date_fin->format('d/m/Y H:i') : null,
                'heure_fin'         => $item->date_fin ? $item->date_fin->format('H:i') : null,
                'type_intervention' => $item->type_intervention ?? implode(', ', $prestationsList),
                'interventions'     => array_values(array_filter($prestationsList)),
                'statut'            => $normalizedStatut,
                'is_rdv'            => (bool) ($item->is_rdv ?? false),
                'est_retour_sav'    => (bool) ($item->est_retour_sav ?? false),
                'motif_blocage'     => $item->motif_blocage,
                'technicien_id'     => $item->user_id ?? $item->technicien?->id,
                'technicien'        => $item->technicien ? [
                    'id'   => $item->technicien->id,
                    'nom'  => $item->technicien->name,
                    'name' => $item->technicien->name,
                ] : ($item->user ? [
                    'id'   => $item->user->id,
                    'nom'  => $item->user->name,
                    'name' => $item->user->name,
                ] : null),
                'pont'              => $item->pont ? [
                    'id'  => $item->pont->id,
                    'nom' => $item->pont->nom,
                ] : null,
            ];
        });

        return response()->json([
            'status'          => 'success',
            'immatriculation' => $matricule,
            'vehicule'        => $vehicule ? [
                'id'               => $vehicule->id,
                'matricule'        => $vehicule->matricule,
                'marque'           => $vehicule->marque,
                'modele'           => $vehicule->modele,
                'nom_complet'      => trim("{$vehicule->marque} {$vehicule->modele}"),
                'client_nom'       => $vehicule->client_nom ?? 'Client Particulier',
                'client_telephone' => $vehicule->client_telephone ?? 'Non renseigné',
            ] : null,
            'total'           => $historique->count(),
            'historique'      => $historique,
            'interventions'   => $historique,
        ], 200);
    }
}
