<?php

namespace Tests\Feature;

use App\Models\Intervention;
use App\Models\Prestation;
use App\Models\User;
use App\Models\Vehicule;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrimeCumulMensuelTest extends TestCase
{
    use RefreshDatabase;

    public function test_technicien_prime_cumul_mensuel_et_details_journaliers()
    {
        // 1. Création d'un technicien actif (Mehdi)
        $mehdi = User::factory()->create([
            'name'      => 'Mehdi Test',
            'email'     => 'mehdi@autoabda.ma',
            'role'      => 'technicien',
            'is_active' => true,
        ]);

        $vehicule = Vehicule::create([
            'matricule'        => '12345-A-26',
            'marque'           => 'Renault',
            'modele'           => 'Clio',
            'client_nom'       => 'Client Test',
            'client_telephone' => '0600000000',
        ]);

        // Jour 1 : 1er Septembre 2026
        // Mehdi facture 10h (600 min) de barème et passe 8h (480 min) en réel -> Temps gagné = 2h (120 min)
        // Seuil 8h (480 min) dépassé -> validé
        Intervention::create([
            'vehicule_id'            => $vehicule->id,
            'user_id'                => $mehdi->id,
            'type_intervention'      => 'Révision Générale',
            'statut'                 => 'Terminé',
            'temps_bareme'           => 600, // 10h
            'temps_bareme_total'     => 600,
            'temps_passe_accumule'   => 480, // 8h
            'temps_passe_minutes'    => 480,
            'date_debut'             => Carbon::parse('2026-09-01 08:00:00'),
            'date_fin'               => Carbon::parse('2026-09-01 16:00:00'),
            'created_at'             => Carbon::parse('2026-09-01 08:00:00'),
            'updated_at'             => Carbon::parse('2026-09-01 16:00:00'),
        ]);

        // Jour 2 : 2 Septembre 2026
        // Mehdi facture 5h (300 min) de barème et passe 4h (240 min)
        // Seuil 8h (480 min) NON dépassé (300 <= 480) -> Journée invalidée, temps gagné = 0, temps perdu = 1h (60 min)
        Intervention::create([
            'vehicule_id'            => $vehicule->id,
            'user_id'                => $mehdi->id,
            'type_intervention'      => 'Vidange & Filtres',
            'statut'                 => 'Terminé',
            'temps_bareme'           => 300, // 5h
            'temps_bareme_total'     => 300,
            'temps_passe_accumule'   => 240, // 4h
            'temps_passe_minutes'    => 240,
            'date_debut'             => Carbon::parse('2026-09-02 08:00:00'),
            'date_fin'               => Carbon::parse('2026-09-02 12:00:00'),
            'created_at'             => Carbon::parse('2026-09-02 08:00:00'),
            'updated_at'             => Carbon::parse('2026-09-02 12:00:00'),
        ]);

        $this->actingAs($mehdi, 'sanctum');

        $response = $this->getJson('/api/direction/bilan?periode=mois&date=2026-09-15&rate=20');

        $response->assertStatus(200);

        $json = $response->json();
        $this->assertEquals('success', $json['status']);

        $performances = collect($json['performances_techniciens'])->firstWhere('id', $mehdi->id);
        $this->assertNotNull($performances);

        // Vérification du cumul mensuel corrigé
        // 1er sept: +2h gagnées. 2 sept: 0h gagnées (car seuil <= 8h).
        // Total mensuel gagné = 2.0 heures
        $this->assertEquals(2.0, $performances['total_mensuel_gagne']);
        $this->assertEquals(120, $performances['total_mensuel_gagne_min']);

        // Total mensuel perdu = 1.0 heure (gain annulé du 2 sept)
        $this->assertEquals(1.0, $performances['total_mensuel_perdu']);
        $this->assertEquals(60, $performances['total_mensuel_perdu_min']);

        // Prime = 2h * 20 MAD = 40 MAD
        $this->assertEquals(40.0, $performances['prime_montant']);

        // Vérification de l'historique journalier
        $details = $performances['details_journaliers'];
        $this->assertCount(2, $details);

        // Jour 1 : 2026-09-01
        $jour1 = $details[0];
        $this->assertEquals('2026-09-01', $jour1['date']);
        $this->assertEquals(1, $jour1['vehicules']);
        $this->assertEquals(10.0, $jour1['bareme_total']);
        $this->assertEquals(8.0, $jour1['passe_total']);
        $this->assertTrue($jour1['seuil_atteint']);
        $this->assertEquals(2.0, $jour1['temps_gagne']);
        $this->assertEquals(0.0, $jour1['temps_perdu']);

        // Jour 2 : 2026-09-02
        $jour2 = $details[1];
        $this->assertEquals('2026-09-02', $jour2['date']);
        $this->assertEquals(1, $jour2['vehicules']);
        $this->assertEquals(5.0, $jour2['bareme_total']);
        $this->assertEquals(4.0, $jour2['passe_total']);
        $this->assertFalse($jour2['seuil_atteint']);
        $this->assertEquals(0.0, $jour2['temps_gagne']);
        $this->assertEquals(1.0, $jour2['temps_perdu']);
    }
}
