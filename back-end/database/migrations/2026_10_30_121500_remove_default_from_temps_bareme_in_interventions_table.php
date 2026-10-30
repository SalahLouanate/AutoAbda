<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Supprime la contrainte de valeur par défaut (60) sur la colonne `temps_bareme` de la table `interventions`.
     */
    public function up(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->unsignedInteger('temps_bareme')->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->unsignedInteger('temps_bareme')->nullable()->default(60)->change();
        });
    }
};
