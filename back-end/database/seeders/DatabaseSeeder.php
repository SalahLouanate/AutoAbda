<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('users')->truncate();
        DB::table('ponts')->truncate();
        Schema::enableForeignKeyConstraints();

        $ponts = [];
        for ($i = 1; $i <= 5; $i++) {
            $ponts[$i] = DB::table('ponts')->insertGetId([
                'nom' => "Pont {$i}",
                'statut' => 'Libre',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        User::create([
            'name' => 'Direction Auto Abda',
            'email' => 'direction@autoabda.ma',
            'password' => Hash::make('password'),
            'role' => 'direction',
            'pont_id' => null,
        ]);

        User::create([
            'name' => 'Sara Benmoussa',
            'email' => 's.benmoussa@autoabda.ma',
            'password' => Hash::make('password'),
            'role' => 'reception',
            'pont_id' => null,
        ]);

        $techniciens = [
            ['name' => 'Yassir Zimi',       'email' => 'y.zimi@autoabda.ma',      'pont_id' => $ponts[1]],
            ['name' => 'Meraouni Mustapha', 'email' => 'm.mustapha@autoabda.ma',  'pont_id' => $ponts[2]],
            ['name' => 'Karim Amrani',      'email' => 'k.amrani@autoabda.ma',     'pont_id' => $ponts[3]],
            ['name' => 'Hamza Bennani',     'email' => 'h.bennani@autoabda.ma',    'pont_id' => $ponts[4]],
            ['name' => 'Sofiane Touati',    'email' => 's.touati@autoabda.ma',     'pont_id' => $ponts[5]],
        ];

        foreach ($techniciens as $tech) {
            User::create([
                'name'     => $tech['name'],
                'email'    => $tech['email'],
                'password' => Hash::make('password'),
                'role'     => 'technicien',
                'pont_id'  => $tech['pont_id'],
            ]);
        }
    }
}
