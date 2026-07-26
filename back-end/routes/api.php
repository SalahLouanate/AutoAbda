<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogueController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DirectionController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RessourceController;
use App\Http\Controllers\Api\TechnicienController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    // User Profile & Password
    Route::get('/user', [ProfileController::class, 'show']);
    Route::put('/user/profile', [ProfileController::class, 'updateProfile']);
    Route::put('/user/password', [ProfileController::class, 'updatePassword']);

    // Routes Dashboard & Direction
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    Route::get('/direction/dashboard', [DirectionController::class, 'dashboard']);
    Route::get('/direction/supervision', [DirectionController::class, 'supervision']);
    Route::get('/direction/bilan', [DirectionController::class, 'bilanMensuel']);
    Route::get('/direction/bilan-mensuel', [DirectionController::class, 'bilanMensuel']);

    // Routes Gestion des Ressources (Personnel & Infrastructures)
    Route::prefix('direction/ressources')->group(function () {
        // Personnel RH
        Route::get('/personnel', [RessourceController::class, 'indexPersonnel']);
        Route::post('/personnel', [RessourceController::class, 'storePersonnel']);
        Route::put('/personnel/{id}', [RessourceController::class, 'updatePersonnel']);
        Route::delete('/personnel/{id}', [RessourceController::class, 'destroyPersonnel']);

        // Infrastructures (Ponts)
        Route::get('/ponts', [RessourceController::class, 'indexPonts']);
        Route::get('/ponts-libres', [RessourceController::class, 'indexPontsLibres']);
        Route::put('/ponts/{id}/statut', [RessourceController::class, 'updatePontStatus']);
        Route::put('/ponts/{id}', [RessourceController::class, 'updatePontStatus']);
    });

    // Catalogue & Barèmes CRUD
    Route::get('/direction/catalogue', [CatalogueController::class, 'index']);
    Route::post('/direction/catalogue', [CatalogueController::class, 'store']);
    Route::put('/direction/catalogue/{id}', [CatalogueController::class, 'update']);
    Route::delete('/direction/catalogue/{id}', [CatalogueController::class, 'destroy']);

    // Routes Espace Technicien
    Route::get('/technicien/tache', [TechnicienController::class, 'getCurrentTask']);
    Route::post('/technicien/tache/{id}/start', [TechnicienController::class, 'startTask']);
    Route::post('/technicien/tache/{id}/block', [TechnicienController::class, 'blockTask']);
    Route::post('/technicien/tache/{id}/finish', [TechnicienController::class, 'finishTask']);
    Route::get('/technicien/historique', [TechnicienController::class, 'getHistory']);
});
