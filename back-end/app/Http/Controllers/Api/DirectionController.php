<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Pont;
use App\Models\Prestation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DirectionController extends Controller
{
    /**
     * Helper pour calculer le barème prévisionnel réel de l'intervention (en minutes).
     */
    private function getBareme(?string $type, ?Intervention $intervention = null): int
    {
        if ($intervention) {
            return $intervention->temps_bareme_total;
        }

        if ($type) {
            $types = array_map('trim', explode(',', $type));
            $sum = (int) Prestation::whereIn('nom', $types)->sum('temps_bareme');
            if ($sum > 0) return $sum;
        }

        return 60;
    }

    /**
     * Helper pour obtenir le tarif théorique d'une prestation (avec cache en mémoire).
     */
    private function getTarifPrestation(?string $type, $prestationsMap = null): float
    {
        if ($type && $prestationsMap && isset($prestationsMap[$type])) {
            return (float) $prestationsMap[$type]->tarif;
        }

        if ($type && !$prestationsMap) {
            $prestation = Prestation::where('nom', $type)->first();
            if ($prestation) {
                return (float) $prestation->tarif;
            }
        }

        $typeLower = mb_strtolower($type ?? '');
        if (str_contains($typeLower, 'vidange')) return 450.0;
        if (str_contains($typeLower, 'diagnostic')) return 350.0;
        if (str_contains($typeLower, 'frein')) return 400.0;
        if (str_contains($typeLower, 'distribution')) return 2200.0;
        if (str_contains($typeLower, 'amortisseur')) return 1200.0;
        if (str_contains($typeLower, 'climatisation')) return 450.0;
        return 350.0;
    }

    /**
     * API pour le Dashboard de la Direction ('Tour de Contrôle').
     * Filtre les techniciens pour exclure strictement les personnes inactives.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $today = Carbon::today();

        // 1. Récupération des 5 ponts avec techniciens actifs (is_active = true) et interventions actives du jour
        $ponts = Pont::with(['users' => function ($query) {
            $query->where('is_active', true);
        }, 'interventions' => function ($query) {
            $query->whereDate('created_at', \Carbon\Carbon::today())
                ->whereIn('statut', ['En cours', 'Bloqué'])
                ->with(['vehicule.prestations', 'user']);
        }])->orderBy('id')->get();

        $totalPonts = $ponts->count() > 0 ? $ponts->count() : 5;

        $chargeTravail = [];
        $pontsSupervision = [];

        foreach ($ponts as $pont) {
            $activeIntervention = $pont->interventions->first();
            
            // 🛑 Exclure tout technicien inactif
            $activeUser = $activeIntervention?->user;
            $technicienAssigne = ($activeUser && ($activeUser->is_active ?? true)) 
                ? $activeUser->name 
                : ($pont->users->first()?->name ?? null);

            $isMaintenance = strtolower($pont->statut) === 'maintenance';

            $statutPont = 'LIBRE';
            $interventionDetails = null;

            if ($isMaintenance) {
                $statutPont = 'MAINTENANCE';
            } elseif ($activeIntervention) {
                $isVar = (bool) $activeIntervention->est_variable;
                $bareme = $isVar ? 0 : (int) ($activeIntervention->temps_bareme_total ?? 60);
                $dateDebut = $activeIntervention->date_debut ? Carbon::parse($activeIntervention->date_debut) : Carbon::now();
                $tempsPasse = max(0, (int) round(Carbon::now()->diffInMinutes($dateDebut)));

                $statutPont = (!$isVar && $bareme > 0 && $tempsPasse > $bareme) ? 'EN_RETARD' : 'EN_COURS';

                $vehiculeName = $activeIntervention->vehicule 
                    ? ($activeIntervention->vehicule->marque . ' ' . $activeIntervention->vehicule->modele)
                    : 'Véhicule N/A';

                $interventionDetails = [
                    'id' => $activeIntervention->id,
                    'vehicule' => $vehiculeName,
                    'matricule' => $activeIntervention->vehicule?->matricule ?? null,
                    'type_intervention' => $activeIntervention->type_intervention,
                    'est_variable' => $isVar,
                    'temps_passe' => $tempsPasse,
                    'bareme' => $bareme,
                    'temps_bareme' => $bareme,
                    'statut_intervention' => $activeIntervention->statut,
                    'motif_blocage' => $activeIntervention->motif_blocage,
                ];

                $chargeTravail[] = [
                    'technicien' => $technicienAssigne ?? ('Technicien ' . $pont->id),
                    'bareme' => $bareme,
                    'temps_bareme' => $bareme,
                    'temps_passe' => $tempsPasse,
                    'vehicule' => $vehiculeName,
                    'pont' => $pont->nom,
                    'est_variable' => $isVar,
                ];
            }

            $pontsSupervision[] = [
                'id' => $pont->id,
                'nom' => $pont->nom,
                'statut' => $statutPont,
                'technicien_assigne' => $technicienAssigne,
                'intervention' => $interventionDetails,
            ];
        }

        $pontsOccupesCount = count(array_filter($pontsSupervision, function ($p) {
            return in_array($p['statut'], ['EN_COURS', 'EN_RETARD']);
        }));

        $pontsLibresCount = count(array_filter($pontsSupervision, function ($p) {
            return $p['statut'] === 'LIBRE';
        }));

        $pourcentageOccupation = $totalPonts > 0 ? round(($pontsOccupesCount / $totalPonts) * 100, 1) : 0;

        // 2. Calcul des KPIs strictement filtrés sur la date du jour (created_at = Carbon::today())
        $totalAujourdhui = Intervention::whereDate('created_at', \Carbon\Carbon::today())->count();
        $clotureesAujourdhui = Intervention::whereDate('created_at', \Carbon\Carbon::today())
            ->where('statut', 'Terminé')
            ->count();

        $kpisPayload = [
            'total_aujourdhui'       => $totalAujourdhui,
            'cloturees_aujourdhui'    => $clotureesAujourdhui,
            'ponts_occupes'          => $pontsOccupesCount,
            'ponts_libres'           => $pontsLibresCount,
            'pourcentage_occupation' => $pourcentageOccupation,
            'interventions_du_jour'  => $totalAujourdhui,
            'terminees_aujourdhui'   => $clotureesAujourdhui,
        ];

        return response()->json([
            'status'                 => 'success',
            'total_aujourdhui'       => $totalAujourdhui,
            'cloturees_aujourdhui'    => $clotureesAujourdhui,
            'ponts_occupes'          => $pontsOccupesCount,
            'ponts_libres'           => $pontsLibresCount,
            'kpis'                   => $kpisPayload,
            'charge_travail'         => $chargeTravail,
            'ponts'                  => $pontsSupervision,
        ], 200);
    }

    /**
     * API pour la Supervision Quotidienne Détaillée de la Direction.
     * Restreint les résultats aux techniciens actifs (is_active = true).
     */
    public function supervision(Request $request): JsonResponse
    {
        $dateParam = $request->query('date');
        $isToday = true;

        if ($dateParam) {
            try {
                $targetDate = Carbon::parse($dateParam)->startOfDay();
                $isToday = $targetDate->isToday();
            } catch (\Exception $e) {
                $targetDate = Carbon::today();
            }
        } else {
            $targetDate = Carbon::today();
        }

        // 🛑 Filtrage strict des présences : uniquement les techniciens actifs (is_active = true)
        // 🛑 Exclusion des interventions annulées pour garder la supervision propre
        $interventions = Intervention::whereHas('user', function ($query) {
                $query->where('is_active', true);
            })
            ->with(['vehicule.prestations', 'user', 'pont'])
            ->where('statut', '!=', 'annule')
            ->where(function ($query) use ($targetDate) {
                $query->whereDate('created_at', $targetDate)
                    ->orWhereDate('date_debut', $targetDate)
                    ->orWhereDate('date_fin', $targetDate);
            })
            ->orderByRaw("FIELD(statut, 'En cours', 'Bloqué', 'En attente', 'Terminé')")
            ->orderBy('updated_at', 'desc')
            ->get();

        $payload = $interventions->map(function ($item) {
            $item->loadMissing('vehicule.prestations');
            $cataloguePrestation = $item->catalogue;

            // 🛑 VERROUILLAGE ABSOLU DE LA DONNÉE : Typage booléen strict
            $isVariable = (bool) ($item->est_variable ?? ($cataloguePrestation->est_variable ?? false));
            $bareme = $isVariable ? 0 : (int) $item->temps_bareme_total;
            
            $tempsPasse = 0;
            if ($item->date_debut) {
                $endDate = $item->date_fin ? Carbon::parse($item->date_fin) : Carbon::now();
                $tempsPasse = max(0, (int) round(Carbon::parse($item->date_debut)->diffInMinutes($endDate)));
            }

            $estEnRetard = !$isVariable && ($item->statut === 'En cours') && ($tempsPasse > $bareme);

            $tempsBaremeOfficiel = $cataloguePrestation ? (int) $cataloguePrestation->temps_bareme : (int) $bareme;

            return [
                'id'                    => $item->id,
                'statut'                => $item->statut,
                'type_intervention'     => $item->type_intervention,
                'est_variable'          => (bool) $isVariable,
                'temps_bareme_officiel' => $tempsBaremeOfficiel,
                'catalogue'             => $cataloguePrestation ? [
                    'id'           => $cataloguePrestation->id,
                    'nom'          => $cataloguePrestation->nom,
                    'temps_bareme' => (int) $cataloguePrestation->temps_bareme,
                    'est_variable' => (bool) $cataloguePrestation->est_variable,
                ] : null,
                'motif_blocage'         => $item->motif_blocage,
                'created_at'            => $item->created_at ? $item->created_at->toIso8601String() : null,
                'heure_arrivee'         => $item->created_at ? $item->created_at->format('H\hi') : null,
                'heure_affectation'     => $item->created_at ? $item->created_at->format('H\hi') : null,
                'heure_debut'           => $item->date_debut ? Carbon::parse($item->date_debut)->format('H\hi') : null,
                'heure_fin'             => $item->date_fin ? Carbon::parse($item->date_fin)->format('H\hi') : null,
                'date_debut'            => $item->date_debut ? $item->date_debut->toIso8601String() : null,
                'started_at'            => $item->date_debut ? $item->date_debut->toIso8601String() : null,
                'date_fin'              => $item->date_fin ? $item->date_fin->toIso8601String() : null,
                'bareme'                => $bareme,
                'temps_bareme_total'    => $bareme,
                'temps_passe'           => $tempsPasse,
                'est_en_retard'         => $estEnRetard,
                'vehicule'           => $item->vehicule ? [
                    'id'          => $item->vehicule->id,
                    'matricule'   => $item->vehicule->matricule,
                    'marque'      => $item->vehicule->marque,
                    'modele'      => $item->vehicule->modele,
                    'nom_complet' => $item->vehicule->marque . ' ' . $item->vehicule->modele,
                    'prestations' => $item->vehicule->prestations->map(function ($p) {
                        return [
                            'id'           => $p->id,
                            'nom'          => $p->nom,
                            'est_variable' => (bool) $p->est_variable,
                        ];
                    }),
                ] : null,
                'client'             => [
                    'nom'       => $item->vehicule?->client_nom ?? 'Client Particulier',
                    'telephone' => $item->vehicule?->client_telephone ?? 'Non renseigné',
                ],
                'technicien'         => [
                    'id'          => $item->user?->id,
                    'nom_complet' => $item->user?->name ?? 'Non assigné',
                    'email'       => $item->user?->email ?? null,
                ],
                'pont'               => [
                    'id'  => $item->pont?->id,
                    'nom' => $item->pont?->nom ?? 'Non affecté',
                ],
            ];
        });

        return response()->json([
            'message'       => 'Supervision quotidienne récupérée avec succès.',
            'date_observee' => $targetDate->format('Y-m-d'),
            'count'         => $payload->count(),
            'interventions' => $payload,
        ], 200);
    }

    /**
     * Annuler une intervention depuis la Supervision Quotidienne.
     * Règles métier :
     *   - Interdit si statut === 'En cours' → 403
     *   - Autorisé uniquement si statut === 'En attente' ou 'Terminé'
     * POST /api/direction/interventions/{id}/annuler
     */
    public function annulerIntervention($id): JsonResponse
    {
        $intervention = Intervention::find($id);

        if (!$intervention) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Intervention introuvable.',
            ], 404);
        }

        // 🛑 Sécurité bloquante : impossible d'annuler une intervention en cours
        if ($intervention->statut === 'En cours') {
            return response()->json([
                'status'  => 'error',
                'message' => "Impossible d'annuler une intervention en cours. Le technicien doit d'abord la terminer ou la bloquer.",
            ], 403);
        }

        // Seules les interventions 'En attente' ou 'Terminé' peuvent être annulées
        if (!in_array($intervention->statut, ['En attente', 'Terminé'])) {
            return response()->json([
                'status'  => 'error',
                'message' => "Impossible d'annuler cette intervention (statut actuel : {$intervention->statut}).",
            ], 422);
        }

        $intervention->update(['statut' => 'annule']);

        // Diffusion temps réel via Laravel Reverb pour synchroniser Réception & Technicien
        broadcast(new \App\Events\InterventionAnnulee((int) $intervention->id));

        return response()->json([
            'status'  => 'success',
            'message' => 'Intervention annulée avec succès.',
            'id'      => (int) $intervention->id,
        ], 200);
    }

    /**
     * Mettre à jour le statut d'une intervention (PATCH /api/direction/interventions/{id}/status)
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'statut' => 'required|string',
        ]);

        $intervention = Intervention::findOrFail($id);
        $newStatut = $request->input('statut');
        $statutLower = mb_strtolower($newStatut);

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
        $intervention->load(['vehicule:id,matricule,marque,modele', 'pont:id,nom,statut', 'user:id,name,email']);

        broadcast(new \App\Events\InterventionStatusChanged($intervention));

        return response()->json([
            'status'       => 'success',
            'message'      => 'Statut de l\'intervention mis à jour avec succès.',
            'statut'       => $intervention->statut,
            'intervention' => $intervention,
        ], 200);
    }

    /**
     * API pour le Bilan & Calcul des Primes de Performance des Techniciens.
     * Filtre les techniciens pour ne calculer les primes que des techniciens actifs (is_active = true).
     */
    public function bilanMensuel(Request $request): JsonResponse
    {
        $periode = strtolower($request->query('periode', $request->query('mode', 'mois')));
        $dateParam = $request->query('date');
        $rate = (float) $request->query('rate', $request->query('commissionRate', 35));

        $isTodayMode = in_array($periode, ['aujourdhui', 'today', 'jour', 'day']);

        if ($dateParam) {
            try {
                $targetCarbon = Carbon::parse($dateParam);
            } catch (\Exception $e) {
                $targetCarbon = Carbon::today();
            }
        } else {
            $targetCarbon = Carbon::today();
        }

        if ($isTodayMode) {
            $periodLabel = $targetCarbon->locale('fr')->translatedFormat('d F Y');
        } else {
            $month = (int) ($request->query('month') ?? $targetCarbon->month);
            $year = (int) ($request->query('year') ?? $targetCarbon->year);
            $targetCarbon = Carbon::createFromDate($year, $month, 1);
            $periodLabel = $targetCarbon->locale('fr')->translatedFormat('F Y');
        }

        // Récupérer toutes les interventions clôturées ("Terminé") de la période spécifiée via when()
        $interventionsCloturees = Intervention::with(['vehicule', 'user', 'pont'])
            ->where('statut', 'Terminé')
            ->when($isTodayMode, function ($query) use ($targetCarbon) {
                return $query->whereDate('created_at', $targetCarbon)
                             ->whereDate('date_fin', $targetCarbon);
            })
            ->when(!$isTodayMode, function ($query) use ($targetCarbon) {
                return $query->whereMonth('created_at', $targetCarbon->month)
                             ->whereYear('created_at', $targetCarbon->year);
            })
            ->get();

        // 🛑 Filtrage des techniciens : uniquement les membres actifs
        $techniciens = User::where('role', 'technicien')
            ->where('is_active', true)
            ->get();

        // Préchargement en mémoire du catalogue de prestations pour éviter les requêtes N+1
        $prestationsMap = Prestation::all()->keyBy('nom');

        $chiffreAffairesTotal = 0;
        $tempsBaremeGlobalMin = 0;
        $tempsPasseGlobalMin = 0;
        $totalPrimesDistribuees = 0;

        $performancesTechniciens = [];

        // Taux de prime fixe : 20 DH par heure de temps barème dépassant le seuil
        $PRIME_TAUX    = 20;   // MAD/heure
        $SEUIL_JOUR_H  = 8;    // heures de seuil journalier

        foreach ($techniciens as $tech) {
            $techInterventions = $interventionsCloturees->where('user_id', $tech->id);

            $countCloturees = $techInterventions->count();
            $baremeMinSum = 0;
            $tempsPasseMinSum = 0;
            $caTech = 0;

            foreach ($techInterventions as $item) {
                $item->loadMissing('vehicule.prestations');
                $bareme = $item->temps_bareme_total;
                $baremeMinSum += $bareme;

                // Calcul du temps passé réel en minutes (date_debut -> date_fin)
                $tempsPasse = 0;
                if ($item->date_debut && $item->date_fin) {
                    $tempsPasse = max(1, (int) round(Carbon::parse($item->date_debut)->diffInMinutes(Carbon::parse($item->date_fin))));
                } elseif ($item->date_debut) {
                    $tempsPasse = max(1, (int) round(Carbon::parse($item->date_debut)->diffInMinutes($item->updated_at)));
                } else {
                    $tempsPasse = $bareme;
                }
                $tempsPasseMinSum += $tempsPasse;

                $tarif = $this->getTarifPrestation($item->type_intervention, $prestationsMap);
                $caTech += $tarif;
            }

            $tempsBaremeH = round($baremeMinSum / 60, 2);
            $tempsPasseH  = round($tempsPasseMinSum / 60, 2);

            $heuresGagnees = round($tempsBaremeH - $tempsPasseH, 2);
            $heuresPerdues = $heuresGagnees < 0 ? abs($heuresGagnees) : 0;

            // ─── Nouvelle logique de prime : 20 DH/h sur le temps barème dépassant le seuil ───
            //
            // Mode JOUR   → seuil = 8 h fixe
            // Mode MOIS   → seuil = 8 h × nombre de jours distincts travaillés par ce technicien
            //               (on compte les jours où la date_fin est renseignée, i.e. interventions clôturées)
            if ($isTodayMode) {
                $seuilH = $SEUIL_JOUR_H;
            } else {
                // Nombre de jours calendaires distincts sur lesquels le technicien a clôturé au moins une intervention
                $joursDistincts = $techInterventions
                    ->filter(fn($i) => !is_null($i->date_fin))
                    ->map(fn($i) => Carbon::parse($i->date_fin)->toDateString())
                    ->unique()
                    ->count();

                // Fallback : si aucun jour n'est détectable, on utilise 1 jour pour éviter un seuil nul
                $seuilH = $SEUIL_JOUR_H * max(1, $joursDistincts);
            }

            $heuresAuDessus = max(0, round($tempsBaremeH - $seuilH, 4));
            $primeMontant   = round($heuresAuDessus * $PRIME_TAUX, 2);
            // ──────────────────────────────────────────────────────────────────────────────────

            // Taux d'efficacité individuel (si le temps passé est de 0, l'efficacité retourne 0)
            $tauxEfficacite = $tempsPasseH > 0 ? round(($tempsBaremeH / $tempsPasseH) * 100, 1) : 0.0;

            $chiffreAffairesTotal  += $caTech;
            $tempsBaremeGlobalMin  += $baremeMinSum;
            $tempsPasseGlobalMin   += $tempsPasseMinSum;
            $totalPrimesDistribuees += $primeMontant;

            // Comptage des interventions marquées comme Retour SAV pour ce technicien sur la période
            $nombreRetours = Intervention::where('user_id', $tech->id)
                ->where('est_retour_sav', true)
                ->when($isTodayMode, function ($query) use ($targetCarbon) {
                    return $query->whereDate('created_at', $targetCarbon);
                })
                ->when(!$isTodayMode, function ($query) use ($targetCarbon) {
                    return $query->whereMonth('created_at', $targetCarbon->month)
                                 ->whereYear('created_at', $targetCarbon->year);
                })
                ->count();

            $performancesTechniciens[] = [
                'id'                      => $tech->id,
                'nom'                     => $tech->name,
                'email'                   => $tech->email,
                'interventions_cloturees' => $countCloturees,
                'nombre_retours'          => $nombreRetours,
                'temps_bareme_minutes'    => $baremeMinSum,
                'temps_bareme_heures'     => $tempsBaremeH,
                'temps_passe_minutes'     => $tempsPasseMinSum,
                'temps_passe_heures'      => $tempsPasseH,
                'heures_gagnees'          => max(0, $heuresGagnees),
                'heures_perdues'          => $heuresPerdues,
                'taux_efficacite'         => $tauxEfficacite,
                'seuil_heures'            => $seuilH,
                'heures_au_dessus_seuil'  => $heuresAuDessus,
                'prime_montant'           => $primeMontant,
                'prime_formatted'         => number_format($primeMontant, 2, ',', ' ') . ' MAD',
                'ca_genere'               => $caTech,
                'ca_genere_formatted'     => number_format($caTech, 2, ',', ' ') . ' MAD',
            ];
        }

        $tempsBaremeGlobalH = round($tempsBaremeGlobalMin / 60, 2);
        $tempsPasseGlobalH  = round($tempsPasseGlobalMin / 60, 2);
        $tempsGagneGlobalH  = max(0, round($tempsBaremeGlobalH - $tempsPasseGlobalH, 2));

        // ─── Calcul de l'Efficacité Globale (Bilan Mensuel) ───
        // 1. Capacité théorique totale = (Nombre de techniciens) × (8 heures = 480 min) × (Nombre de jours travaillés dans le mois)
        // 2. Temps de travail réel = Somme des durées de toutes les interventions terminées sur cette période ($tempsPasseGlobalMin)
        // 3. Efficacité Globale (%) = (Temps de travail réel / Capacité théorique totale) × 100 (arrondi à l'entier le plus proche)
        $nombreTechniciens = $techniciens->count();

        if ($isTodayMode) {
            $joursTravailles = 1;
        } else {
            $joursTravailles = $interventionsCloturees
                ->filter(fn($i) => !is_null($i->date_fin))
                ->map(fn($i) => Carbon::parse($i->date_fin)->toDateString())
                ->unique()
                ->count();
            $joursTravailles = max(1, $joursTravailles);
        }

        // Capacité théorique en minutes : 8 heures/jour/technicien = 480 minutes/jour/technicien
        $capaciteTheoriqueTotalMin = $nombreTechniciens * 480 * $joursTravailles;
        $capaciteTheoriqueTotalH   = round($capaciteTheoriqueTotalMin / 60, 2);

        // Calcul de l'efficacité globale (%) arrondie à l'entier le plus proche (ex: 85%)
        $tauxEfficaciteGlobal = $capaciteTheoriqueTotalMin > 0
            ? (int) round(($tempsPasseGlobalMin / $capaciteTheoriqueTotalMin) * 100)
            : 0;

        return response()->json([
            'message' => 'Bilan et calcul des primes générés avec succès.',
            'periode' => [
                'mode'    => $isTodayMode ? 'aujourdhui' : 'mois',
                'periode' => $periode,
                'label'   => $periodLabel,
                'rate'    => $rate,
            ],
            'kpis_globaux' => [
                'total_interventions'        => $interventionsCloturees->count(),
                'chiffre_affaires'           => $chiffreAffairesTotal,
                'chiffre_affaires_formatted' => number_format($chiffreAffairesTotal, 2, ',', ' ') . ' MAD',
                'temps_bareme_total'         => $tempsBaremeGlobalH,
                'temps_passe_total'          => $tempsPasseGlobalH,
                'temps_gagne_total'          => $tempsGagneGlobalH,
                'nombre_techniciens'         => $nombreTechniciens,
                'jours_travailles'           => $joursTravailles,
                'capacite_theorique_heures'  => $capaciteTheoriqueTotalH,
                'taux_efficacite_global'     => $tauxEfficaciteGlobal,
                'total_primes_distribuees'   => $totalPrimesDistribuees,
                'total_primes_formatted'     => number_format($totalPrimesDistribuees, 2, ',', ' ') . ' MAD',
            ],
            'performances_techniciens' => $performancesTechniciens,
        ], 200);
    }
}
