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
        if (!Schema::hasColumn('interventions', 'is_rdv')) {
            Schema::table('interventions', function (Blueprint $table) {
                $table->boolean('is_rdv')->default(false)->after('type_intervention');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('interventions', 'is_rdv')) {
            Schema::table('interventions', function (Blueprint $table) {
                $table->dropColumn('is_rdv');
            });
        }
    }
};
