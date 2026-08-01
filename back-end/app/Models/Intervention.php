<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Intervention extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicule_id',
        'user_id',
        'pont_id',
        'type_intervention',
        'statut',
        'is_rdv',
        'motif_blocage',
        'date_debut',
        'date_fin',
    ];

    protected $appends = ['started_at', 'temps_bareme_total'];

    protected function casts(): array
    {
        return [
            'is_rdv'     => 'boolean',
            'date_debut' => 'datetime',
            'date_fin'   => 'datetime',
        ];
    }

    /**
     * Accessor pour started_at (alias de date_debut au format ISO string).
     */
    public function getStartedAtAttribute(): ?string
    {
        return $this->date_debut ? $this->date_debut->toIso8601String() : null;
    }

    /**
     * Accessor pour la somme réelle des temps barémés des prestations attachées au véhicule (en minutes).
     */
    public function getTempsBaremeTotalAttribute(): int
    {
        if ($this->relationLoaded('vehicule') && $this->vehicule && $this->vehicule->relationLoaded('prestations')) {
            $sum = (int) $this->vehicule->prestations->sum('temps_bareme');
            if ($sum > 0) return $sum;
        }

        if ($this->vehicule_id) {
            $vehicule = $this->vehicule ?? Vehicule::with('prestations')->find($this->vehicule_id);
            if ($vehicule && $vehicule->prestations && $vehicule->prestations->count() > 0) {
                $sum = (int) $vehicule->prestations->sum('temps_bareme');
                if ($sum > 0) return $sum;
            }
        }

        if ($this->type_intervention) {
            $types = array_map('trim', explode(',', $this->type_intervention));
            $sum = (int) Prestation::whereIn('nom', $types)->sum('temps_bareme');
            if ($sum > 0) return $sum;
        }

        return 60;
    }

    /**
     * Get the vehicle associated with the intervention.
     */
    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class);
    }

    /**
     * Get the user (technicien) assigned to the intervention.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Alias relationship for technicien.
     */
    public function technicien(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the pont associated with the intervention.
     */
    public function pont(): BelongsTo
    {
        return $this->belongsTo(Pont::class);
    }
}
