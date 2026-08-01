<?php

namespace App\Events;

use App\Models\Intervention;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Intervention $intervention;

    /**
     * Create a new event instance.
     */
    public function __construct(Intervention $intervention)
    {
        $this->intervention = $intervention->loadMissing(['vehicule', 'pont', 'user']);
    }

    /**
     * Broadcast on public channel 'garage'.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('garage');
    }

    /**
     * Nom explicite de l'événement diffusé pour Laravel Echo.
     */
    public function broadcastAs(): string
    {
        return 'TicketStatusUpdated';
    }

    /**
     * Données transmises au front-end pour la mise à jour dynamique.
     */
    public function broadcastWith(): array
    {
        return [
            'id'                => $this->intervention->id,
            'statut'            => $this->intervention->statut,
            'motif_blocage'     => $this->intervention->motif_blocage,
            'type_intervention'  => $this->intervention->type_intervention,
            'date_debut'         => $this->intervention->date_debut ? $this->intervention->date_debut->toISOString() : null,
            'started_at'         => $this->intervention->date_debut ? $this->intervention->date_debut->toISOString() : null,
            'date_fin'           => $this->intervention->date_fin ? $this->intervention->date_fin->toISOString() : null,
            'temps_bareme_total' => $this->intervention->temps_bareme_total,
            'bareme'             => $this->intervention->temps_bareme_total,
            'technicien_id'     => $this->intervention->user_id,
            'vehicule'          => $this->intervention->vehicule ? [
                'id'        => $this->intervention->vehicule->id,
                'matricule' => $this->intervention->vehicule->matricule,
                'marque'    => $this->intervention->vehicule->marque,
                'modele'    => $this->intervention->vehicule->modele,
            ] : null,
            'pont'              => $this->intervention->pont ? [
                'id'     => $this->intervention->pont->id,
                'nom'    => $this->intervention->pont->nom,
                'statut' => $this->intervention->pont->statut,
            ] : null,
            'technicien'        => $this->intervention->user ? [
                'id'          => $this->intervention->user->id,
                'nom'         => $this->intervention->user->name,
                'nom_complet' => $this->intervention->user->name,
                'name'        => $this->intervention->user->name,
            ] : null,
        ];
    }
}
