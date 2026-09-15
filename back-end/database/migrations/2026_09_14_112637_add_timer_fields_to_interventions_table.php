<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute les colonnes de gestion du chronomètre à la table interventions.
     *
     * - temps_passe_minutes : Accumulateur du temps réel passé en minutes.
     *   Incrémenté à chaque mise en pause ou blocage. C'est la source de vérité
     *   pour le calcul des primes (pas le calcul dynamique now() - date_debut).
     *
     * - heure_reprise : Timestamp de la dernière reprise du timer (dernière mise en 'En cours').
     *   NULL = timer arrêté (pause ou blocage). NON NULL = timer en cours de décompte.
     *
     * Ces deux colonnes permettent un chrono pausable/resumable fiable côté serveur.
     */
    public function up(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->unsignedInteger('temps_passe_minutes')
                  ->default(0)
                  ->after('temps_bareme')
                  ->comment('Temps réel accumulé en minutes (mis à jour à chaque pause ou blocage).');

            $table->timestamp('heure_reprise')
                  ->nullable()
                  ->after('temps_passe_minutes')
                  ->comment('Timestamp de la dernière mise en cours. NULL = timer arrêté.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropColumn(['temps_passe_minutes', 'heure_reprise']);
        });
    }
};
