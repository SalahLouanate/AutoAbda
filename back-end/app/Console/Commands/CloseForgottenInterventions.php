<?php

namespace App\Console\Commands;

use App\Events\InterventionStatusChanged;
use App\Events\PontStatusUpdated;
use App\Events\TicketStatusUpdated;
use App\Models\Intervention;
use App\Models\Pont;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CloseForgottenInterventions extends Command
{
    /**
     * Le nom et la signature de la commande Artisan.
     *
     * @var string
     */
    protected $signature = 'interventions:close-forgotten';

    /**
     * La description de la commande Artisan.
     *
     * @var string
     */
    protected $description = 'Clôture automatiquement les interventions oubliées la veille à l\'heure de fermeture configurée.';

    /**
     * Exécuter la commande Artisan.
     */
    public function handle(): int
    {
        // 1. Récupération de l'heure de fermeture paramétrée (défaut: 19:00)
        $closingTimeStr = Setting::where('key', 'auto_closing_time')->value('value') ?? '19:00';

        [$hour, $minute] = explode(':', $closingTimeStr);
        $hour = (int) $hour;
        $minute = (int) ($minute ?? 0);

        // 2. Cibler les interventions non terminées des jours précédents (created_at < Carbon::today())
        $forgottenInterventions = Intervention::whereIn('statut', ['En cours', 'Bloqué', 'En attente'])
            ->whereDate('created_at', '<', Carbon::today())
            ->get();

        $count = $forgottenInterventions->count();

        if ($count === 0) {
            $this->info("Aucune intervention oubliée à clôturer pour les jours précédents.");
            return Command::SUCCESS;
        }

        foreach ($forgottenInterventions as $intervention) {
            // 3. Changement de statut vers 'Terminé'
            $intervention->statut = 'Terminé';

            // 4. Calcul de date_fin : date de création avec l'heure de fermeture dynamique Carbon
            $createdAt = Carbon::parse($intervention->created_at);
            $dateFin = $createdAt->copy()->setTime($hour, $minute, 0);

            // Sécurité : s'assurer que date_debut existe pour la cohérence des bilans
            if (!$intervention->date_debut) {
                $intervention->date_debut = $createdAt->copy();
            }

            $intervention->date_fin = $dateFin;
            $intervention->save();

            // Libérer le pont s'il était attribué et n'a plus d'interventions actives
            if ($intervention->pont_id) {
                $pont = Pont::find($intervention->pont_id);
                if ($pont) {
                    $otherActive = Intervention::where('pont_id', $pont->id)
                        ->whereIn('statut', ['En cours', 'Bloqué'])
                        ->exists();

                    if (!$otherActive) {
                        $pont->update(['statut' => 'Libre']);
                    }
                }
            }

            // Diffusion des événements Temps Réel Reverb pour mise à jour immédiate
            try {
                broadcast(new TicketStatusUpdated($intervention));
                broadcast(new InterventionStatusChanged($intervention));
            } catch (\Exception $e) {
                // Ignorer les erreurs de broadcast en CLI si Reverb n'est pas accessible
            }
        }

        try {
            broadcast(new PontStatusUpdated());
        } catch (\Exception $e) {
            // Ignorer
        }

        $this->info("{$count} intervention(s) oubliée(s) clôturée(s) avec succès à {$closingTimeStr}.");

        return Command::SUCCESS;
    }
}
