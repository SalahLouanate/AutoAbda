<?php

namespace App\Events;

use App\Models\Intervention;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewVehicleArrived implements ShouldBroadcastNow
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
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('atelier');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'intervention.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id'                => $this->intervention->id,
            'immat'             => $this->intervention->vehicule ? $this->intervention->vehicule->matricule : 'N/A',
            'marque'            => $this->intervention->vehicule ? "{$this->intervention->vehicule->marque} {$this->intervention->vehicule->modele}" : 'Véhicule N/A',
            'statut'            => $this->intervention->statut,
            'type_intervention' => $this->intervention->type_intervention,
            'heure'             => $this->intervention->created_at ? $this->intervention->created_at->format('H:i') : now()->format('H:i'),
            'rdv'               => (bool) ($this->intervention->is_rdv ?? false),
        ];
    }
}
