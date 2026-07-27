<?php

namespace Database\Seeders;

use App\Models\Intervention;
use App\Models\Pont;
use App\Models\User;
use App\Models\Vehicule;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class InterventionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Création d'un parc de 10 véhicules fictifs avec données clients réalistes
        $vehiculesData = [
            ['matricule' => '14582-A-26', 'marque' => 'Renault',    'modele' => 'Express 2021', 'client_nom' => 'Othmane Bennani',    'client_telephone' => '0661-234567'],
            ['matricule' => '23901-B-6',  'marque' => 'Dacia',      'modele' => 'Logan',        'client_nom' => 'Fatima El Amrani',   'client_telephone' => '0662-987654'],
            ['matricule' => '88301-D-1',  'marque' => 'Dacia',      'modele' => 'Duster',       'client_nom' => 'Karim Tazi',         'client_telephone' => '0663-456789'],
            ['matricule' => '45120-H-26', 'marque' => 'Peugeot',    'modele' => '208',          'client_nom' => 'Siham Chaoui',       'client_telephone' => '0664-112233'],
            ['matricule' => '67219-A-1',  'marque' => 'Citroën',    'modele' => 'C-Elysée',     'client_nom' => 'Youssef Alami',      'client_telephone' => '0665-445566'],
            ['matricule' => '34982-G-6',  'marque' => 'Volkswagen', 'modele' => 'Golf 7',       'client_nom' => 'Mehdi Berrada',      'client_telephone' => '0666-778899'],
            ['matricule' => '90123-F-40', 'marque' => 'Toyota',     'modele' => 'Hilux',        'client_nom' => 'Société TransSud',   'client_telephone' => '0522-334455'],
            ['matricule' => '51294-A-26', 'marque' => 'Hyundai',    'modele' => 'Accent',       'client_nom' => 'Nadia Filali',       'client_telephone' => '0667-001122'],
            ['matricule' => '12890-B-15', 'marque' => 'Ford',       'modele' => 'Transit',      'client_nom' => 'Atlas Logistique',   'client_telephone' => '0524-889900'],
            ['matricule' => '76543-D-6',  'marque' => 'Fiat',       'modele' => 'Tipo',         'client_nom' => 'Rachid Kabbaj',      'client_telephone' => '0668-332211'],
        ];

        $vehicules = [];
        foreach ($vehiculesData as $data) {
            $vehicules[] = Vehicule::create($data);
        }

        // Récupération des techniciens et des ponts
        $techniciens = User::where('role', 'technicien')->get();
        $yassir = $techniciens->where('email', 'y.zimi@autoabda.ma')->first();
        $mustapha = $techniciens->where('email', 'm.mustapha@autoabda.ma')->first();
        $karim = $techniciens->where('email', 'k.amrani@autoabda.ma')->first();
        $hamza = $techniciens->where('email', 'h.bennani@autoabda.ma')->first();
        $sofiane = $techniciens->where('email', 's.touati@autoabda.ma')->first();

        $typesInterventions = [
            'Vidange & Filtres',
            'Diagnostic Électronique',
            'Changement Plaquettes de Frein',
            'Parallélisme & Géométrie',
            'Changement Courroie de Distribution',
            'Recharge Climatisation',
            'Changement Amortisseurs',
            'Remplacement Batterie',
            'Révision Générale',
            'Diagnostic Moteur',
        ];

        // 2. Interventions 'Terminé' pour AUJOURD'HUI (journée en cours)
        for ($i = 0; $i < 8; $i++) {
            $vehicule = $vehicules[$i % count($vehicules)];
            $tech = $techniciens[$i % count($techniciens)];
            $pontId = $tech->pont_id ?? (($i % 5) + 1);

            $startHour = 8 + ($i % 4);
            $durationMinutes = 45 + ($i * 10);

            $dateDebut = Carbon::today()->setTime($startHour, 0);
            $dateFin = (clone $dateDebut)->addMinutes($durationMinutes);

            Intervention::create([
                'vehicule_id'       => $vehicule->id,
                'user_id'           => $tech->id,
                'pont_id'           => $pontId,
                'type_intervention' => $typesInterventions[$i % count($typesInterventions)],
                'statut'            => 'Terminé',
                'date_debut'        => $dateDebut,
                'date_fin'          => $dateFin,
                'created_at'        => $dateDebut,
                'updated_at'        => $dateFin,
            ]);
        }

        // 3. Historique : 12 interventions 'Terminé' sur les 7 derniers jours
        for ($i = 0; $i < 12; $i++) {
            $vehicule = $vehicules[($i + 3) % count($vehicules)];
            $tech = $techniciens->random();
            $pontId = $tech->pont_id ?? rand(1, 5);

            $daysAgo = rand(1, 7);
            $startHour = rand(8, 15);
            $durationMinutes = rand(40, 120);

            $dateDebut = Carbon::now()->subDays($daysAgo)->setTime($startHour, rand(0, 59));
            $dateFin = (clone $dateDebut)->addMinutes($durationMinutes);

            Intervention::create([
                'vehicule_id'       => $vehicule->id,
                'user_id'           => $tech->id,
                'pont_id'           => $pontId,
                'type_intervention' => $typesInterventions[array_rand($typesInterventions)],
                'statut'            => 'Terminé',
                'date_debut'        => $dateDebut,
                'date_fin'          => $dateFin,
                'created_at'        => $dateDebut,
                'updated_at'        => $dateFin,
            ]);
        }

        // 4. Interventions actives pour aujourd'hui sur les ponts
        $pont1 = Pont::find(1);
        if ($yassir && $pont1) {
            Intervention::create([
                'vehicule_id'       => $vehicules[0]->id,
                'user_id'           => $yassir->id,
                'pont_id'           => $pont1->id,
                'type_intervention' => 'Vidange & Filtres Complexe',
                'statut'            => 'En cours',
                'date_debut'        => Carbon::now()->subHours(1),
                'date_fin'          => null,
            ]);
            $pont1->update(['statut' => 'Occupé']);
        }

        $pont2 = Pont::find(2);
        if ($mustapha && $pont2) {
            Intervention::create([
                'vehicule_id'       => $vehicules[1]->id,
                'user_id'           => $mustapha->id,
                'pont_id'           => $pont2->id,
                'type_intervention' => 'Diagnostic Électronique',
                'statut'            => 'En cours',
                'date_debut'        => Carbon::now()->subMinutes(30),
                'date_fin'          => null,
            ]);
            $pont2->update(['statut' => 'Occupé']);
        }

        $pont3 = Pont::find(3);
        if ($karim && $pont3) {
            Intervention::create([
                'vehicule_id'       => $vehicules[2]->id,
                'user_id'           => $karim->id,
                'pont_id'           => $pont3->id,
                'type_intervention' => 'Changement Plaquettes de Frein',
                'statut'            => 'En cours',
                'date_debut'        => Carbon::now()->subMinutes(15),
                'date_fin'          => null,
            ]);
            $pont3->update(['statut' => 'Occupé']);
        }

        $pont4 = Pont::find(4);
        if ($hamza && $pont4) {
            Intervention::create([
                'vehicule_id'       => $vehicules[3]->id,
                'user_id'           => $hamza->id,
                'pont_id'           => $pont4->id,
                'type_intervention' => 'Révision Générale',
                'statut'            => 'Bloqué',
                'motif_blocage'     => 'En attente de pièces de rechange',
                'date_debut'        => Carbon::now()->subHours(2),
                'date_fin'          => null,
            ]);
            $pont4->update(['statut' => 'Occupé']);
        }

        $pont5 = Pont::find(5);
        if ($sofiane && $pont5) {
            Intervention::create([
                'vehicule_id'       => $vehicules[4]->id,
                'user_id'           => $sofiane->id,
                'pont_id'           => $pont5->id,
                'type_intervention' => 'Changement Courroie de Distribution',
                'statut'            => 'En attente',
                'date_debut'        => null,
                'date_fin'          => null,
            ]);
            $pont5->update(['statut' => 'Libre']);
        }
    }
}
