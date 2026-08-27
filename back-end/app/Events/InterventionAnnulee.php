<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InterventionAnnulee implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $interventionId;

    /**
     * Create a new event instance.
     */
    public function __construct(int $interventionId)
    {
        $this->interventionId = $interventionId;
    }

    /**
     * Diffuser sur les canaux publics 'garage' et 'atelier'.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('garage'),
            new Channel('atelier'),
        ];
    }

    /**
     * Nom explicite de l'événement diffusé pour Laravel Echo.
     */
    public function broadcastAs(): string
    {
        return 'InterventionAnnulee';
    }

    /**
     * Données essentielles transmises au front-end lors de l'annulation.
     */
    public function broadcastWith(): array
    {
        return [
            'intervention_id' => $this->interventionId,
            'id'              => $this->interventionId,
        ];
    }
}
