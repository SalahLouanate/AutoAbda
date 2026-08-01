<?php

namespace App\Events;

use App\Models\Intervention;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketCreated implements ShouldBroadcastNow
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
        return 'TicketCreated';
    }

    /**
     * Données essentielles transmises au front-end.
     */
    public function broadcastWith(): array
    {
        $vehicule = $this->intervention->vehicule;
        $technicien = $this->intervention->user;

        return [
            'id'              => $this->intervention->id,
            'immatriculation' => $vehicule ? $vehicule->matricule : 'INCONNU',
            'immat'           => $vehicule ? $vehicule->matricule : 'INCONNU',
            'marque'          => $vehicule ? trim("{$vehicule->marque} {$vehicule->modele}") : 'Inconnu',
            'technicien_id'   => $this->intervention->user_id,
            'technicien'      => $technicien ? [
                'id'   => $technicien->id,
                'nom'  => $technicien->name,
                'name' => $technicien->name,
            ] : null,
            'interventions'   => (array) (
                $vehicule && $vehicule->prestations->isNotEmpty()
                    ? $vehicule->prestations->pluck('nom')->toArray()
                    : explode(', ', $this->intervention->type_intervention ?? '')
            ),
            'rdv'             => (bool) ($this->intervention->is_rdv ?? false),
            'statut'          => $this->intervention->statut,
            'heure'           => $this->intervention->created_at ? $this->intervention->created_at->format('H:i') : now()->format('H:i'),
        ];
    }
}
