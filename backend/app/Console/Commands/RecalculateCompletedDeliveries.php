<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Shipment;
use Illuminate\Console\Command;

class RecalculateCompletedDeliveries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:recalculate-deliveries';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate completed deliveries count for all users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Recalculating completed deliveries for all users...');

        $users = User::all();
        $bar = $this->output->createProgressBar($users->count());

        foreach ($users as $user) {
            // Count shipments where user is sender and status is delivered
            $asSender = Shipment::where('sender_id', $user->id)
                ->where('status', 'delivered')
                ->count();

            // Count shipments where user is traveler and status is delivered
            $asTraveler = Shipment::where('traveler_id', $user->id)
                ->where('status', 'delivered')
                ->count();

            // Total completed deliveries
            $totalCompleted = $asSender + $asTraveler;

            // Update user
            $user->completed_deliveries = $totalCompleted;
            $user->save();
            
            // Update recommended status
            $user->updateRecommendedStatus();

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Completed deliveries recalculated successfully!');

        return 0;
    }
}
