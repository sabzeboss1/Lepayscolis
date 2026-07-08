<?php

namespace App\Console\Commands;

use App\Models\Trip;
use App\Models\User;
use App\Notifications\TripCompletedNotification;
use App\Notifications\AdminTripAutoCompletedNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class CompleteExpiredTrips extends Command
{
    protected $signature = 'trips:complete-expired
                            {--dry-run : Affiche les trips concernés sans effectuer de modifications}';

    protected $description = 'Marque les voyages expirés comme terminés (les shipments restent intacts)';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        $this->info($isDryRun ? '[DRY-RUN] Simulation — aucune modification.' : 'Recherche des voyages expirés...');
        $this->newLine();

        $expiredTrips = Trip::with('traveler')
            ->where('status', 'active')
            ->where('arrival_date', '<', now())
            ->get();

        if ($expiredTrips->isEmpty()) {
            $this->info('Aucun voyage expiré trouvé.');
            return Command::SUCCESS;
        }

        $this->info("Voyages expirés à traiter : {$expiredTrips->count()}");
        $this->newLine();

        $totalCompleted = 0;

        foreach ($expiredTrips as $trip) {
            $this->line("  Voyage #{$trip->id} — {$trip->departure_city} → {$trip->arrival_city} (arrivée : {$trip->arrival_date->format('d/m/Y')})");

            if (!$isDryRun) {
                $trip->update(['status' => 'completed']);

                if ($trip->traveler) {
                    $trip->traveler->notify(new TripCompletedNotification($trip));
                }

                $this->info("  → Marqué comme terminé");
            }

            $totalCompleted++;
        }

        if (!$isDryRun && $totalCompleted > 0) {
            $admins = User::whereIn('role', ['admin', 'super_admin'])->get();
            Notification::send($admins, new AdminTripAutoCompletedNotification($totalCompleted));
        }

        $this->newLine();
        $this->info($isDryRun
            ? "[DRY-RUN] {$totalCompleted} voyage(s) seraient traités."
            : "{$totalCompleted} voyage(s) marqués comme terminés."
        );

        return Command::SUCCESS;
    }
}
