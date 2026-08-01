<?php

namespace App\Events;

use App\Models\Pont;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PontStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $stats;

    /**
     * Create a new event instance.
     */
    public function __construct(array $stats = [])
    {
        if (empty($stats)) {
            $ponts = Pont::with(['interventions' => function ($q) {
                $q->whereIn('statut', ['En cours', 'Bloqué']);
            }])->get();

            $total = $ponts->count();
            $occupes = $ponts->filter(fn($p) => strtolower($p->statut) === 'occupé' || $p->interventions->isNotEmpty())->count();
            $libres = $ponts->filter(fn($p) => strtolower($p->statut) === 'libre' && $p->interventions->isEmpty())->count();
            $taux = $total > 0 ? round(($occupes / $total) * 100, 1) : 0;

            $this->stats = [
                'total_ponts'            => $total,
                'ponts_occupes'          => $occupes,
                'ponts_libres'           => $libres,
                'pourcentage_occupation' => $taux,
                'updated_at'             => now()->toISOString(),
            ];
        } else {
            $this->stats = $stats;
        }
    }

    /**
     * Broadcast on public channel 'atelier'.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('atelier');
    }

    /**
     * Broadcast name for Echo listeners.
     */
    public function broadcastAs(): string
    {
        return 'intervention.updated';
    }

    /**
     * Payload sent to clients.
     */
    public function broadcastWith(): array
    {
        return $this->stats;
    }
}
