<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Shipment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixCompletedDeliveriesCount extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'fix:completed-deliveries {--dry-run : Show what would be changed without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Fix the completed_deliveries count for all users based on actual delivered shipments';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        } else {
            $this->info('🔧 FIXING completed_deliveries counts...');
        }

        $users = User::all();
        $totalFixed = 0;
        $totalUsers = $users->count();

        $this->info("📊 Checking {$totalUsers} users...");

        foreach ($users as $user) {
            // Count actual delivered shipments where user was the traveler
            $actualDeliveries = Shipment::where('traveler_id', $user->id)
                ->where('status', 'delivered')
                ->count();

            $currentCount = $user->completed_deliveries;

            if ($currentCount !== $actualDeliveries) {
                $this->warn("👤 User {$user->name} (ID: {$user->id}):");
                $this->warn("   Current count: {$currentCount}");
                $this->warn("   Actual deliveries: {$actualDeliveries}");
                $this->warn("   Difference: " . ($currentCount - $actualDeliveries));

                if (!$isDryRun) {
                    $user->update(['completed_deliveries' => $actualDeliveries]);
                    $this->info("   ✅ Fixed!");
                } else {
                    $this->info("   🔍 Would be fixed in real run");
                }

                $totalFixed++;
            }
        }

        if ($totalFixed === 0) {
            $this->info('✅ All completed_deliveries counts are correct!');
        } else {
            if ($isDryRun) {
                $this->warn("🔍 DRY RUN: {$totalFixed} users would be fixed");
                $this->info('Run without --dry-run to apply changes');
            } else {
                $this->info("✅ Fixed {$totalFixed} users");
            }
        }

        return 0;
    }
}