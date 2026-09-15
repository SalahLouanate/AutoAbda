<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            if (!Schema::hasColumn('interventions', 'temps_passe_accumule')) {
                $table->unsignedInteger('temps_passe_accumule')->default(0)->after('temps_bareme');
            }
            if (!Schema::hasColumn('interventions', 'chrono_start_time')) {
                $table->timestamp('chrono_start_time')->nullable()->after('temps_passe_accumule');
            }
        });

        // Migration des données existantes si les anciennes colonnes existaient
        if (Schema::hasColumn('interventions', 'temps_passe_minutes')) {
            DB::statement('UPDATE interventions SET temps_passe_accumule = COALESCE(temps_passe_minutes, 0) WHERE temps_passe_accumule = 0');
        }
        if (Schema::hasColumn('interventions', 'heure_reprise')) {
            DB::statement('UPDATE interventions SET chrono_start_time = heure_reprise WHERE chrono_start_time IS NULL AND heure_reprise IS NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            if (Schema::hasColumn('interventions', 'temps_passe_accumule')) {
                $table->dropColumn('temps_passe_accumule');
            }
            if (Schema::hasColumn('interventions', 'chrono_start_time')) {
                $table->dropColumn('chrono_start_time');
            }
        });
    }
};
