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
        'est_retour_sav',
        'motif_blocage',
        'date_debut',
        'date_fin',
        'temps_bareme',          // ✅ Barème persisté côté serveur à la création
        'temps_passe_accumule',  // ✅ Accumulateur strict du temps réel en minutes
        'chrono_start_time',     // ✅ Heure exacte du dernier démarrage/reprise (NULL = chrono arrêté)
        'temps_passe_minutes',   // Alias rétro-compatible
        'heure_reprise',         // Alias rétro-compatible
    ];

    protected $appends = ['started_at', 'temps_bareme_total', 'est_variable', 'temps_passe', 'temps_passe_accumule', 'chrono_start_time'];

    protected function casts(): array
    {
        return [
            'is_rdv'               => 'boolean',
            'est_retour_sav'       => 'boolean',
            'date_debut'           => 'datetime',
            'date_fin'             => 'datetime',
            'chrono_start_time'    => 'datetime',
            'heure_reprise'        => 'datetime',
            'temps_passe_accumule' => 'integer',
            'temps_passe_minutes'  => 'integer',
        ];
    }

    /**
     * Accessor pourstarted_at (alias de date_debut au format ISO string).
     */
    public function getStartedAtAttribute(): ?string
    {
        return $this->date_debut ? $this->date_debut->toIso8601String() : null;
    }

    /**
     * Accessor pour la somme réelle des temps barémés des prestations (en minutes).
     *
     * Priorité 1 : valeur persistée en colonne `temps_bareme` (calculée côté serveur à la création).
     * Priorité 2 : calcul dynamique via les prestations liées (fallback pour anciens enregistrements).
     */
    public function getTempsBaremeTotalAttribute(): int
    {
        // ✅ PRIORITÉ 1 : Valeur persistée côté serveur — fiable et indépendante du pivot partagé
        $persisted = isset($this->attributes['temps_bareme']) ? (int) $this->attributes['temps_bareme'] : 0;
        if ($persisted > 0) {
            return $persisted;
        }

        // Fallback : calcul dynamique pour les anciens enregistrements sans colonne persistée
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
     * Accessor pour obtenir l'objet catalogue (prestation associée).
     */
    public function getCatalogueAttribute()
    {
        if ($this->relationLoaded('vehicule') && $this->vehicule && $this->vehicule->relationLoaded('prestations')) {
            return $this->vehicule->prestations->first();
        }

        if ($this->type_intervention) {
            $types = array_map('trim', explode(',', $this->type_intervention));
            return Prestation::whereIn('nom', $types)->first();
        }

        return null;
    }

    /**
     * Accessor pour déterminer si l'intervention contient au moins une prestation à durée variable.
     */
    public function getEstVariableAttribute(): bool
    {
        if ($this->relationLoaded('vehicule') && $this->vehicule && $this->vehicule->relationLoaded('prestations')) {
            $hasVar = $this->vehicule->prestations->contains(function ($p) {
                return (bool) $p->est_variable === true;
            });
            if ($this->vehicule->prestations->count() > 0) {
                return $hasVar;
            }
        }

        if ($this->vehicule_id) {
            $vehicule = $this->vehicule ?? Vehicule::with('prestations')->find($this->vehicule_id);
            if ($vehicule && $vehicule->prestations && $vehicule->prestations->count() > 0) {
                return $vehicule->prestations->contains(function ($p) {
                    return (bool) $p->est_variable === true;
                });
            }
        }

        if ($this->type_intervention) {
            $types = array_map('trim', explode(',', $this->type_intervention));
            return Prestation::whereIn('nom', $types)->where('est_variable', true)->exists();
        }

        return false;
    }

    /**
     * Démarre ou reprend le chronomètre sans incrémenter le temps accumulé.
     */
    public function demarrerChrono(): void
    {
        $now = now();
        $this->attributes['chrono_start_time'] = $now;
        $this->attributes['heure_reprise']     = $now;
    }

    /**
     * Pattern Accumulateur (Stopwatch) :
     * Calcule la différence entre now() et chrono_start_time,
     * l'ajoute à temps_passe_accumule, et met chrono_start_time à NULL.
     * Si le temps calculé dépasse une limite absurde (ex: >= 800 minutes due à un oubli de nuit),
     * il est automatiquement plafonné à min($temps_calcule, $temps_bareme + 60).
     */
    public function accumulerTempsEtStopperTimer(): int
    {
        $startTime = $this->attributes['chrono_start_time'] ?? $this->attributes['heure_reprise'] ?? $this->chrono_start_time ?? $this->heure_reprise;

        if (!$startTime) {
            $this->attributes['chrono_start_time'] = null;
            $this->attributes['heure_reprise'] = null;
            return 0; // Chrono déjà arrêté — rien à ajouter
        }

        $carbonStart = $startTime instanceof \Carbon\Carbon ? $startTime : \Carbon\Carbon::parse($startTime);
        $minutesEcoulees = (int) abs(now()->diffInMinutes($carbonStart));
        
        $ancienTotal = (int) ($this->attributes['temps_passe_accumule'] ?? $this->attributes['temps_passe_minutes'] ?? 0);
        $nouveauTotal = $ancienTotal + $minutesEcoulees;

        // 🛑 SÉCURITÉ ANTI-BOURDE NOCTURNE :
        // Si le technicien a oublié d'arrêter le ticket la nuit (>= 800 minutes ~ 13h+),
        // on plafonne le temps calculé à min($nouveauTotal, temps_bareme + 60 minutes)
        if ($nouveauTotal >= 800) {
            $bareme = max(60, (int) ($this->temps_bareme_total ?? 60));
            $nouveauTotal = min($nouveauTotal, $bareme + 60);
        }

        $this->attributes['temps_passe_accumule'] = $nouveauTotal;
        $this->attributes['temps_passe_minutes']  = $nouveauTotal;

        // Arrêt strict du chronomètre
        $this->attributes['chrono_start_time'] = null;
        $this->attributes['heure_reprise']     = null;

        return $minutesEcoulees;
    }

    /**
     * Calcule le temps passé total réel en minutes :
     * temps_passe_accumule + (now - chrono_start_time si chrono_start_time != null).
     * Si bloqué ou en pause, chrono_start_time est null, donc le temps est strictement égal à temps_passe_accumule.
     */
    public function getTempsPasseReel(): int
    {
        $accumule = (int) ($this->attributes['temps_passe_accumule'] ?? $this->attributes['temps_passe_minutes'] ?? 0);
        $startTime = $this->attributes['chrono_start_time'] ?? $this->attributes['heure_reprise'] ?? $this->chrono_start_time ?? $this->heure_reprise;

        if ($startTime) {
            $carbonStart = $startTime instanceof \Carbon\Carbon ? $startTime : \Carbon\Carbon::parse($startTime);
            $minutesDepuisReprise = (int) abs(now()->diffInMinutes($carbonStart));
            $total = $accumule + $minutesDepuisReprise;
            // Plafonnement de sécurité de lecture si oubli nocturne en cours
            if ($total >= 800) {
                $bareme = max(60, (int) ($this->temps_bareme_total ?? 60));
                return min($total, $bareme + 60);
            }
            return $total;
        }

        // ✅ FALLBACK : Pour les anciens enregistrements terminés sans accumulateur sauvegardé (> 0),
        // calculer la durée réelle à partir de date_debut et date_fin
        if ($accumule === 0 && $this->date_debut && $this->date_fin) {
            return max(1, (int) round(\Carbon\Carbon::parse($this->date_debut)->diffInMinutes(\Carbon\Carbon::parse($this->date_fin))));
        }

        return $accumule;
    }

    /**
     * Accessor pour alias temps_passe (en minutes).
     */
    public function getTempsPasseAttribute(): int
    {
        return $this->getTempsPasseReel();
    }

    /**
     * Mutator pour alias temps_passe.
     */
    public function setTempsPasseAttribute($value): void
    {
        $this->attributes['temps_passe_accumule'] = (int) $value;
        $this->attributes['temps_passe_minutes'] = (int) $value;
    }

    /**
     * Accessor pour temps_passe_accumule.
     */
    public function getTempsPasseAccumuleAttribute(): int
    {
        return (int) ($this->attributes['temps_passe_accumule'] ?? $this->attributes['temps_passe_minutes'] ?? 0);
    }

    /**
     * Mutator pour temps_passe_accumule.
     */
    public function setTempsPasseAccumuleAttribute($value): void
    {
        $this->attributes['temps_passe_accumule'] = (int) $value;
        $this->attributes['temps_passe_minutes'] = (int) $value;
    }

    /**
     * Mutator pour alias rétro-compatible temps_passe_minutes.
     */
    public function setTempsPasseMinutesAttribute($value): void
    {
        $this->attributes['temps_passe_minutes'] = (int) $value;
        $this->attributes['temps_passe_accumule'] = (int) $value;
    }

    /**
     * Accessor pour chrono_start_time (ISO string format).
     */
    public function getChronoStartTimeAttribute(): ?string
    {
        $val = $this->attributes['chrono_start_time'] ?? $this->attributes['heure_reprise'] ?? null;
        if (!$val) return null;
        if ($val instanceof \Carbon\Carbon) {
            return $val->toIso8601String();
        }
        try {
            return \Carbon\Carbon::parse($val)->toIso8601String();
        } catch (\Exception $e) {
            return (string) $val;
        }
    }

    /**
     * Mutator pour chrono_start_time.
     */
    public function setChronoStartTimeAttribute($value): void
    {
        $this->attributes['chrono_start_time'] = $value;
        $this->attributes['heure_reprise'] = $value;
    }

    /**
     * Mutator pour alias rétro-compatible heure_reprise.
     */
    public function setHeureRepriseAttribute($value): void
    {
        $this->attributes['heure_reprise'] = $value;
        $this->attributes['chrono_start_time'] = $value;
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
