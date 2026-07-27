<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Prestation extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'categorie',
        'temps_bareme',
        'tarif',
        'description',
    ];

    /**
     * Get all vehicles associated with this prestation (Many-to-Many via pivot).
     */
    public function vehicules(): BelongsToMany
    {
        return $this->belongsToMany(Vehicule::class, 'prestation_vehicule')->withTimestamps();
    }
}
