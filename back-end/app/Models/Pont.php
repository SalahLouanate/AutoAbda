<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pont extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'statut',
    ];

    /**
     * Get all interventions for this pont.
     */
    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class);
    }

    /**
     * Get the active intervention ('En cours') for this pont.
     */
    public function activeIntervention(): HasOne
    {
        return $this->hasOne(Intervention::class)->where('statut', 'En cours');
    }

    /**
     * Get all users (techniciens) assigned to this pont.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
