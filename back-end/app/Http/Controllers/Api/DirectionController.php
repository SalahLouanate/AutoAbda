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
     * Helper pour estimer le barème prévisionnel de l'intervention (en minutes).
     */
    private function getBareme(?string $type): int
    {
        $typeLower = mb_strtolower($type ?? '');
        if (str_contains($typeLower, 'vidange')) return 45;
        if (str_contains($typeLower, 'diagnostic')) return 60;
        if (str_contains($typeLower, 'frein')) return 90;
        if (str_contains($typeLower, 'distribution')) return 180;
        if (str_contains($typeLower, 'amortisseur') || str_contains($typeLower, 'suspension')) return 120;
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

        // 1. Récupération des 5 ponts avec techniciens actifs (is_active = true) et interventions actives
        $ponts = Pont::with(['users' => function ($query) {
            $query->where('is_active', true);
        }, 'interventions' => function ($query) {
            $query->whereIn('statut', ['En cours', 'Bloqué'])->with(['vehicule', 'user']);
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
                $bareme = $this->getBareme($activeIntervention->type_intervention);
                $dateDebut = $activeIntervention->date_debut ? Carbon::parse($activeIntervention->date_debut) : Carbon::now();
                $tempsPasse = max(0, (int) round(Carbon::now()->diffInMinutes($dateDebut)));

                $statutPont = ($tempsPasse > $bareme) ? 'EN_RETARD' : 'EN_COURS';

                $vehiculeName = $activeIntervention->vehicule 
                    ? ($activeIntervention->vehicule->marque . ' ' . $activeIntervention->vehicule->modele)
                    : 'Véhicule N/A';

                $interventionDetails = [
                    'id' => $activeIntervention->id,
                    'vehicule' => $vehiculeName,
                    'matricule' => $activeIntervention->vehicule?->matricule ?? null,
                    'type_intervention' => $activeIntervention->type_intervention,
                    'temps_passe' => $tempsPasse,
                    'bareme' => $bareme,
                    'statut_intervention' => $activeIntervention->statut,
                    'motif_blocage' => $activeIntervention->motif_blocage,
                ];

                $chargeTravail[] = [
                    'technicien' => $technicienAssigne ?? ('Technicien ' . $pont->id),
                    'bareme' => $bareme,
                    'temps_passe' => $tempsPasse,
                    'vehicule' => $vehiculeName,
                    'pont' => $pont->nom,
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

        $interventionsDuJour = Intervention::whereDate('created_at', $today)->count();
        $termineesAujourdhui = Intervention::where('statut', 'Terminé')
            ->where(function ($query) use ($today) {
                $query->whereDate('date_fin', $today)
                    ->orWhereDate('updated_at', $today);
            })->count();

        return response()->json([
            'kpis' => [
                'ponts_occupes' => $pontsOccupesCount,
                'pourcentage_occupation' => $pourcentageOccupation,
                'ponts_libres' => $pontsLibresCount,
                'interventions_du_jour' => $interventionsDuJour,
                'terminees_aujourdhui' => $termineesAujourdhui,
            ],
            'charge_travail' => $chargeTravail,
            'ponts' => $pontsSupervision,
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
        $interventions = Intervention::whereHas('user', function ($query) {
                $query->where('is_active', true);
            })
            ->with(['vehicule', 'user', 'pont'])
            ->where(function ($query) use ($targetDate, $isToday) {
                $query->whereDate('created_at', $targetDate)
                    ->orWhereDate('date_debut', $targetDate)
                    ->orWhereDate('date_fin', $targetDate);

                if ($isToday) {
                    $query->orWhereIn('statut', ['En cours', 'Bloqué', 'En attente']);
                }
            })
            ->orderByRaw("FIELD(statut, 'En cours', 'Bloqué', 'En attente', 'Terminé')")
            ->orderBy('updated_at', 'desc')
            ->get();

        $payload = $interventions->map(function ($item) {
            $bareme = $this->getBareme($item->type_intervention);
            
            $tempsPasse = 0;
            if ($item->date_debut) {
                $endDate = $item->date_fin ? Carbon::parse($item->date_fin) : Carbon::now();
                $tempsPasse = max(0, (int) round(Carbon::parse($item->date_debut)->diffInMinutes($endDate)));
            }

            $estEnRetard = ($item->statut === 'En cours') && ($tempsPasse > $bareme);

            return [
                'id'                 => $item->id,
                'statut'             => $item->statut,
                'type_intervention'  => $item->type_intervention,
                'motif_blocage'      => $item->motif_blocage,
                'heure_arrivee'      => $item->created_at ? $item->created_at->format('H:i') : null,
                'date_debut'         => $item->date_debut ? $item->date_debut->toIso8601String() : null,
                'date_fin'           => $item->date_fin ? $item->date_fin->toIso8601String() : null,
                'bareme'             => $bareme,
                'temps_passe'        => $tempsPasse,
                'est_en_retard'      => $estEnRetard,
                'vehicule'           => $item->vehicule ? [
                    'id'          => $item->vehicule->id,
                    'matricule'   => $item->vehicule->matricule,
                    'marque'      => $item->vehicule->marque,
                    'modele'      => $item->vehicule->modele,
                    'nom_complet' => $item->vehicule->marque . ' ' . $item->vehicule->modele,
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
     * API pour le Bilan & Calcul des Primes de Performance des Techniciens.
     * Filtre les techniciens pour ne calculer les primes que des techniciens actifs (is_active = true).
     */
    public function bilanMensuel(Request $request): JsonResponse
    {
        $mode = strtolower($request->query('mode', 'month'));
        $dateParam = $request->query('date');
        $rate = (float) $request->query('rate', $request->query('commissionRate', 35));

        $isTodayMode = in_array($mode, ['today', 'jour', 'day']);

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
            $startDate = (clone $targetCarbon)->startOfDay();
            $endDate = (clone $targetCarbon)->endOfDay();
            $periodLabel = $startDate->locale('fr')->translatedFormat('d F Y');
        } else {
            $month = (int) ($request->query('month') ?? $targetCarbon->month);
            $year = (int) ($request->query('year') ?? $targetCarbon->year);
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = (clone $startDate)->endOfMonth();
            $periodLabel = $startDate->locale('fr')->translatedFormat('F Y');
        }

        // Récupérer toutes les interventions clôturées ("Terminé") de la période spécifiée
        $interventionsCloturees = Intervention::with(['vehicule', 'user', 'pont'])
            ->where('statut', 'Terminé')
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('date_fin', [$startDate, $endDate])
                    ->orWhereBetween('updated_at', [$startDate, $endDate])
                    ->orWhereBetween('created_at', [$startDate, $endDate]);
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

        foreach ($techniciens as $tech) {
            $techInterventions = $interventionsCloturees->where('user_id', $tech->id);

            $countCloturees = $techInterventions->count();
            $baremeMinSum = 0;
            $tempsPasseMinSum = 0;
            $caTech = 0;

            foreach ($techInterventions as $item) {
                $bareme = $this->getBareme($item->type_intervention);
                $baremeMinSum += $bareme;

                // Calcul du temps passé en minutes
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
            $tempsPasseH = round($tempsPasseMinSum / 60, 2);

            $heuresGagnees = round($tempsBaremeH - $tempsPasseH, 2);
            $heuresPerdues = $heuresGagnees < 0 ? abs($heuresGagnees) : 0;

            // Calcul de la prime selon le $rate dynamique fourni (ex: 35 MAD/h)
            $primeMontant = $heuresGagnees > 0 ? round($heuresGagnees * $rate, 2) : 0;

            // Taux d'efficacité individuel
            $tauxEfficacite = $tempsPasseH > 0 ? round(($tempsBaremeH / $tempsPasseH) * 100, 1) : 100.0;

            $chiffreAffairesTotal += $caTech;
            $tempsBaremeGlobalMin += $baremeMinSum;
            $tempsPasseGlobalMin += $tempsPasseMinSum;
            $totalPrimesDistribuees += $primeMontant;

            $performancesTechniciens[] = [
                'id'                      => $tech->id,
                'nom'                     => $tech->name,
                'email'                   => $tech->email,
                'interventions_cloturees' => $countCloturees,
                'temps_bareme_minutes'    => $baremeMinSum,
                'temps_bareme_heures'     => $tempsBaremeH,
                'temps_passe_minutes'     => $tempsPasseMinSum,
                'temps_passe_heures'      => $tempsPasseH,
                'heures_gagnees'          => max(0, $heuresGagnees),
                'heures_perdues'          => $heuresPerdues,
                'taux_efficacite'         => $tauxEfficacite,
                'prime_montant'           => $primeMontant,
                'prime_formatted'         => number_format($primeMontant, 2, ',', ' ') . ' MAD',
                'ca_genere'               => $caTech,
                'ca_genere_formatted'     => number_format($caTech, 2, ',', ' ') . ' MAD',
            ];
        }

        $tempsBaremeGlobalH = round($tempsBaremeGlobalMin / 60, 2);
        $tempsPasseGlobalH = round($tempsPasseGlobalMin / 60, 2);
        $tempsGagneGlobalH = max(0, round($tempsBaremeGlobalH - $tempsPasseGlobalH, 2));

        $tauxEfficaciteGlobal = $tempsPasseGlobalH > 0 
            ? round(($tempsBaremeGlobalH / $tempsPasseGlobalH) * 100, 1) 
            : 100.0;

        return response()->json([
            'message' => 'Bilan et calcul des primes générés avec succès.',
            'periode' => [
                'mode'  => $isTodayMode ? 'today' : 'month',
                'label' => $periodLabel,
                'start' => $startDate->toIso8601String(),
                'end'   => $endDate->toIso8601String(),
                'rate'  => $rate,
            ],
            'kpis_globaux' => [
                'total_interventions'        => $interventionsCloturees->count(),
                'chiffre_affaires'           => $chiffreAffairesTotal,
                'chiffre_affaires_formatted' => number_format($chiffreAffairesTotal, 2, ',', ' ') . ' MAD',
                'temps_bareme_total'         => $tempsBaremeGlobalH,
                'temps_passe_total'          => $tempsPasseGlobalH,
                'temps_gagne_total'          => $tempsGagneGlobalH,
                'taux_efficacite_global'     => $tauxEfficaciteGlobal,
                'total_primes_distribuees'   => $totalPrimesDistribuees,
                'total_primes_formatted'     => number_format($totalPrimesDistribuees, 2, ',', ' ') . ' MAD',
            ],
            'performances_techniciens' => $performancesTechniciens,
        ], 200);
    }
}
