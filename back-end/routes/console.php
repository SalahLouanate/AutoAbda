<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Planification de la tâche de clôture automatique des interventions oubliées la veille à 00:01
Schedule::command('interventions:close-forgotten')->dailyAt('00:01');
