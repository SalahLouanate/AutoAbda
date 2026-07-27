<?php

namespace App\Events;

use App\Models\Intervention;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InterventionStatusChanged implements ShouldBroadcast
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
     * Diffuser sur le canal public 'atelier'.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('atelier');
    }

    /**
     * Nom explicite de l'événement diffusé pour Laravel Echo.
     */
    public function broadcastAs(): string
    {
        return 'InterventionStatusChanged';
    }

    /**
     * Données transmises au front-end.
     */
    public function broadcastWith(): array
    {
        return [
            'id'                => $this->intervention->id,
            'statut'            => $this->intervention->statut,
            'motif_blocage'     => $this->intervention->motif_blocage,
            'type_intervention' => $this->intervention->type_intervention,
            'date_debut'        => $this->intervention->date_debut ? $this->intervention->date_debut->toISOString() : null,
            'date_fin'          => $this->intervention->date_fin ? $this->intervention->date_fin->toISOString() : null,
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
                'id'    => $this->intervention->user->id,
                'name'  => $this->intervention->user->name,
                'email' => $this->intervention->user->email,
            ] : null,
        ];
    }
}
