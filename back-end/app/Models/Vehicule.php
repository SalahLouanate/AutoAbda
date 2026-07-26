<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicule extends Model
{
    use HasFactory;

    protected $fillable = [
        'matricule',
        'marque',
        'modele',
        'client_nom',
        'client_telephone',
    ];

    /**
     * Get all interventions for the vehicle.
     */
    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class);
    }
}
