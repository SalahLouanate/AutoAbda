<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('interventions', 'est_retour_sav')) {
            Schema::table('interventions', function (Blueprint $table) {
                $table->boolean('est_retour_sav')->default(false)->after('is_rdv');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('interventions', 'est_retour_sav')) {
            Schema::table('interventions', function (Blueprint $table) {
                $table->dropColumn('est_retour_sav');
            });
        }
    }
};
