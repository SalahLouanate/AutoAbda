<?php

namespace App\Console\Commands;

use App\Models\Intervention;
use App\Models\Prestation;
use Illuminate\Console\Command;

class FixTempsBareme extends Command
{
    /**
     * Le nom et la signature de la commande Artisan.
     *
     * @var string
     */
    protected $signature = 'fix:temps-bareme {--dry-run : Exécuter sans modifier les données en base}';

    /**
     * La description de la commande Artisan.
     *
     * @var string
     */
    protected $description = 'Corrige rétroactivement le temps barémé de toutes les interventions en recalculant la somme exacte des prestations associées.';

    /**
     * Exécuter la commande Artisan.
     */
    public function handle(): int
    {
        $this->info("Démarrage de la vérification et correction des temps barémés...");

        $interventions = Intervention::with(['prestations', 'vehicule.prestations'])->get();
        $total = $interventions->count();

        if ($total === 0) {
            $this->info("Aucune intervention trouvée en base de données.");
            return Command::SUCCESS;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $corriges = 0;
        $invariable = 0;
        $sansPrestation = 0;
        $isDryRun = (bool) $this->option('dry-run');

        foreach ($interventions as $intervention) {
            // 1. Récupération des prestations liées directes
            $prestations = $intervention->prestations;

            // 2. Fallback rétro-compatible pour les anciens tickets pré-migration de pivot
            if ($prestations->isEmpty()) {
                if (!empty($intervention->type_intervention)) {
                    $names = array_values(array_filter(array_map('trim', explode(',', $intervention->type_intervention))));
                    $found = Prestation::whereIn('nom', $names)->get();
                    if ($found->isNotEmpty()) {
                        $prestations = $found;
                        if (!$isDryRun) {
                            $intervention->prestations()->syncWithoutDetaching($found->pluck('id'));
                        }
                    }
                }

                if ($prestations->isEmpty() && $intervention->vehicule && $intervention->vehicule->prestations->isNotEmpty()) {
                    $prestations = $intervention->vehicule->prestations;
                    if (!$isDryRun) {
                        $intervention->prestations()->syncWithoutDetaching($prestations->pluck('id'));
                    }
                }
            }

            // 3. Recalcul de la somme exacte si prestations présentes
            if ($prestations->isNotEmpty()) {
                $somme = (int) $prestations->sum('temps_bareme');
                $actuel = (int) $intervention->temps_bareme;

                // 4. Si la somme trouvée est différente du temps_bareme actuel, mettre à jour
                if ($somme !== $actuel) {
                    if (!$isDryRun) {
                        $intervention->temps_bareme = $somme;
                        $intervention->save();
                    }
                    $corriges++;
                } else {
                    $invariable++;
                }
            } else {
                $sansPrestation++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        if ($isDryRun) {
            $this->warn("[DRY-RUN] Mode simulation activé. Aucune modification persistée.");
        }

        $this->info("=== RÉSUMÉ DE L'OPÉRATION ===");
        $this->line("• Total interventions analysées : {$total}");
        $this->line("• Tickets corrigés               : {$corriges}");
        $this->line("• Tickets déjà corrects          : {$invariable}");
        $this->line("• Tickets sans prestation connue : {$sansPrestation}");

        if ($corriges > 0) {
            $this->newLine();
            $this->info("✅ Succès : {$corriges} ticket(s) d'intervention ont été corrigé(s) avec succès !");
        } else {
            $this->info("✅ Tous les tickets d'intervention étaient déjà conformes à leur barème réel.");
        }

        return Command::SUCCESS;
    }
}
