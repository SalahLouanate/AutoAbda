<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute la colonne `temps_bareme` à la table interventions.
     *
     * Cette colonne persiste le total des durées barémées calculé côté serveur
     * lors de la création du ticket (somme des temps_bareme de toutes les prestations
     * sélectionnées par la réception).
     *
     * Cela corrige le bug de calcul incorrect lié au pivot partagé
     * prestation_vehicule entre plusieurs interventions d'un même véhicule.
     *
     * Valeur par défaut : 60 minutes (défaut métier si aucune prestation connue).
     */
    public function up(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->unsignedInteger('temps_bareme')
                  ->nullable()
                  ->default(60)
                  ->after('type_intervention')
                  ->comment('Total des temps barémés (en minutes) — calculé et persisté côté serveur à la création du ticket.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropColumn('temps_bareme');
        });
    }
};
