<?php

namespace Tests\Feature;

use App\Models\Intervention;
use App\Models\User;
use App\Models\Vehicule;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StopwatchAndDateFilteringTest extends TestCase
{
    use RefreshDatabase;

    public function test_intervention_serialization_and_accessors(): void
    {
        $intervention = new Intervention([
            'temps_passe_accumule' => 45,
            'temps_bareme'         => 60,
        ]);
        $intervention->chrono_start_time = Carbon::now()->subMinutes(10);

        $array = $intervention->toArray();

        $this->assertArrayHasKey('temps_passe_accumule', $array);
        $this->assertArrayHasKey('chrono_start_time', $array);
        $this->assertEquals(45, $array['temps_passe_accumule']);
        $this->assertNotNull($array['chrono_start_time']);
    }

    public function test_demarrer_chrono_synchronizes_timestamps(): void
    {
        $intervention = new Intervention();
        $this->assertNull($intervention->chrono_start_time);
        $this->assertNull($intervention->heure_reprise);

        $intervention->demarrerChrono();

        $this->assertNotNull($intervention->chrono_start_time);
        $this->assertNotNull($intervention->heure_reprise);
    }

    public function test_accumuler_temps_et_stopper_timer_with_night_overdue_capping(): void
    {
        $intervention = new Intervention([
            'temps_bareme'         => 90,
            'temps_passe_accumule' => 0,
        ]);

        // Simuler un chrono démarré la veille (16 heures avant = 960 minutes)
        $intervention->chrono_start_time = Carbon::now()->subMinutes(960);
        $intervention->accumulerTempsEtStopperTimer();

        // Le temps calculé (960 min >= 800 min) doit être plafonné à temps_bareme (90) + 60 = 150 minutes
        $this->assertNull($intervention->chrono_start_time);
        $this->assertNull($intervention->heure_reprise);
        $this->assertEquals(150, $intervention->temps_passe_accumule);
        $this->assertEquals(150, $intervention->temps_passe_minutes);
    }

    public function test_accumuler_temps_normal_running(): void
    {
        $intervention = new Intervention([
            'temps_bareme'         => 60,
            'temps_passe_accumule' => 20,
        ]);

        $sub = Carbon::now()->subMinutes(15);
        $intervention->chrono_start_time = $sub;
        $res = $intervention->accumulerTempsEtStopperTimer();

        $this->assertEquals(15, $res);
        $this->assertNull($intervention->chrono_start_time);
        $this->assertEquals(35, $intervention->temps_passe_accumule);
    }

    public function test_ticket_attribution_by_created_at_not_date_fin(): void
    {
        $tech = User::factory()->create([
            'role'      => 'technicien',
            'is_active' => true,
        ]);

        $vehicule = Vehicule::create([
            'matricule'        => '12345-A-1',
            'marque'           => 'Renault',
            'modele'           => 'Clio',
            'client_nom'       => 'Test Client',
            'client_telephone' => '0600000000',
        ]);

        $yesterday = Carbon::yesterday();
        $today     = Carbon::today();

        // Intervention créée hier et clôturée aujourd'hui (oubliée la nuit)
        $intervention = new Intervention([
            'user_id'              => $tech->id,
            'vehicule_id'          => $vehicule->id,
            'statut'               => 'Terminé',
            'type_intervention'    => 'Vidange',
            'temps_bareme'         => 60,
            'temps_passe_accumule' => 70,
            'date_debut'           => $yesterday->copy()->setTime(17, 0),
            'date_fin'             => $today->copy()->setTime(9, 0),
        ]);
        $intervention->created_at = $yesterday->copy()->setTime(16, 30);
        $intervention->updated_at = $today->copy()->setTime(9, 0);
        $intervention->save();

        // 1. Filtrage historique aujourd'hui : NE DOIT PAS contenir le ticket d'hier
        $historyToday = Intervention::where('user_id', $tech->id)
            ->where('statut', 'Terminé')
            ->whereDate('created_at', $today)
            ->count();
        $this->assertEquals(0, $historyToday, 'Le ticket créé hier ne doit pas être comptabilisé pour aujourdhui');

        // 2. Filtrage historique hier : DOIT contenir le ticket créé hier
        $historyYesterday = Intervention::where('user_id', $tech->id)
            ->where('statut', 'Terminé')
            ->whereDate('created_at', $yesterday)
            ->count();
        $this->assertEquals(1, $historyYesterday, 'Le ticket créé hier doit être attribué strictement à hier');
    }
}
