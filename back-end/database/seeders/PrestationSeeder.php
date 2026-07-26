<?php

namespace Database\Seeders;

use App\Models\Prestation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PrestationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('prestations')->truncate();

        $prestations = [
            // Entretien & Vidange
            ['nom' => 'Vidange Moteur Moteur Synthétique & Filtres', 'categorie' => 'Entretien & Vidange',       'temps_bareme' => 45,  'tarif' => 450.00,  'description' => 'Huile 5W30 + filtre à huile + filtre à air.'],
            ['nom' => 'Révision Générale Complète',                 'categorie' => 'Entretien & Vidange',       'temps_bareme' => 90,  'tarif' => 950.00,  'description' => 'Vidange complète, contrôle 50 points de sécurité.'],
            ['nom' => 'Remplacement Filtre à Carburant (Gazole)',    'categorie' => 'Entretien & Vidange',       'temps_bareme' => 30,  'tarif' => 250.00,  'description' => 'Remplacement et purge du circuit.'],

            // Électronique & Diagnostic
            ['nom' => 'Diagnostic Électronique & Valise',           'categorie' => 'Électronique & Diagnostic', 'temps_bareme' => 60,  'tarif' => 350.00,  'description' => 'Scan complet des calculateurs, rapport d\'erreurs.'],
            ['nom' => 'Remplacement Batterie & Réinitialisation',   'categorie' => 'Électronique & Diagnostic', 'temps_bareme' => 30,  'tarif' => 650.00,  'description' => 'Pose batterie neuve et enregistrement BMS.'],
            ['nom' => 'Reprogrammation & Reset Témoins',            'categorie' => 'Électronique & Diagnostic', 'temps_bareme' => 45,  'tarif' => 300.00,  'description' => 'Effacement des voyants tableau de bord.'],

            // Freinage & Liaison au Sol
            ['nom' => 'Changement Plaquettes de Frein Avant',       'categorie' => 'Freinage & Liaison au sol', 'temps_bareme' => 60,  'tarif' => 400.00,  'description' => 'Plaquettes de haute qualité + dépoussiérage.'],
            ['nom' => 'Changement Disques & Plaquettes',            'categorie' => 'Freinage & Liaison au sol', 'temps_bareme' => 90,  'tarif' => 850.00,  'description' => 'Rectification/Remplacement disques + plaquettes.'],
            ['nom' => 'Parallélisme & Géométrie 3D',               'categorie' => 'Freinage & Liaison au sol', 'temps_bareme' => 45,  'tarif' => 300.00,  'description' => 'Réglage des train avant et arrière.'],
            ['nom' => 'Changement Amortisseurs Avant (Paire)',       'categorie' => 'Freinage & Liaison au sol', 'temps_bareme' => 120, 'tarif' => 1200.00, 'description' => 'Remplacement des 2 amortisseurs + coupelles.'],

            // Mécanique Lourde
            ['nom' => 'Kit Distribution & Pompe à Eau',            'categorie' => 'Mécanique Lourde',          'temps_bareme' => 180, 'tarif' => 2200.00, 'description' => 'Remplacement kit courroie + galets + liquide de refroidissement.'],
            ['nom' => 'Remplacement Kit Embrayage',                 'categorie' => 'Mécanique Lourde',          'temps_bareme' => 240, 'tarif' => 2800.00, 'description' => 'Dépose boîte de vitesses, disque, mécanisme et butée.'],

            // Climatisation & Confort
            ['nom' => 'Recharge Climatisation R134a / R1234yf',     'categorie' => 'Climatisation & Confort',   'temps_bareme' => 45,  'tarif' => 450.00,  'description' => 'Tirage au vide, contrôle étanchéité et rechargement gaz.'],
            ['nom' => 'Traitement Antibactérien & Filtre Habitacle', 'categorie' => 'Climatisation & Confort',   'temps_bareme' => 30,  'tarif' => 200.00,  'description' => 'Purification des conduits d\'air et filtre à pollen.'],
        ];

        foreach ($prestations as $item) {
            Prestation::create($item);
        }
    }
}
