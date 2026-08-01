<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $ticketId;

    /**
     * Create a new event instance.
     */
    public function __construct(int $ticketId)
    {
        $this->ticketId = $ticketId;
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
        return 'TicketDeleted';
    }

    /**
     * Données essentielles transmises au front-end lors de la suppression.
     */
    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticketId,
            'id'        => $this->ticketId,
        ];
    }
}
