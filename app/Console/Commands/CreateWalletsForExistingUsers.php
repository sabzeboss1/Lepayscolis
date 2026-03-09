<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CreateWalletsForExistingUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wallet:migrate-existing-users
                            {--dry-run : Run without making changes}
                            {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create wallets for existing users who do not have one';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $isForced = $this->option('force');

        $this->info('Wallet Migration Command');
        $this->info('========================');
        $this->newLine();

        // Find users without wallets
        $usersWithoutWallets = User::doesntHave('wallet')->get();
        $totalUsers = User::count();
        $usersWithWallets = $totalUsers - $usersWithoutWallets->count();

        $this->info("Total users: {$totalUsers}");
        $this->info("Users with wallets: {$usersWithWallets}");
        $this->info("Users without wallets: {$usersWithoutWallets->count()}");
        $this->newLine();

        if ($usersWithoutWallets->isEmpty()) {
            $this->info('✓ All users already have wallets. No migration needed.');
            return self::SUCCESS;
        }

        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
            $this->newLine();
            $this->table(
                ['User ID', 'Name', 'Email', 'Created At'],
                $usersWithoutWallets->map(fn($user) => [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->created_at->format('Y-m-d H:i:s'),
                ])->toArray()
            );
            return self::SUCCESS;
        }

        // Confirm before proceeding
        if (!$isForced) {
            if (!$this->confirm("Create wallets for {$usersWithoutWallets->count()} users?")) {
                $this->warn('Migration cancelled.');
                return self::FAILURE;
            }
        }

        $this->newLine();
        $this->info('Creating wallets...');
        $progressBar = $this->output->createProgressBar($usersWithoutWallets->count());
        $progressBar->start();

        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        foreach ($usersWithoutWallets as $user) {
            try {
                DB::transaction(function () use ($user) {
                    // Double-check wallet doesn't exist (race condition protection)
                    if (!$user->wallet()->exists()) {
                        Wallet::create([
                            'user_id' => $user->id,
                            'balance' => 0.00,
                        ]);
                    }
                });

                $successCount++;
                Log::info('Wallet created for existing user', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                ]);
            } catch (\Exception $e) {
                $errorCount++;
                $errors[] = [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ];
                Log::error('Failed to create wallet for existing user', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Display results
        $this->info('Migration Results:');
        $this->info("✓ Successfully created: {$successCount} wallets");
        
        if ($errorCount > 0) {
            $this->error("✗ Failed: {$errorCount} wallets");
            $this->newLine();
            $this->error('Errors:');
            $this->table(
                ['User ID', 'Email', 'Error'],
                array_map(fn($error) => [
                    $error['user_id'],
                    $error['email'],
                    substr($error['error'], 0, 50) . '...',
                ], $errors)
            );
        }

        $this->newLine();

        // Verify final state
        $remainingWithoutWallets = User::doesntHave('wallet')->count();
        if ($remainingWithoutWallets === 0) {
            $this->info('✓ All users now have wallets!');
            return self::SUCCESS;
        } else {
            $this->warn("⚠ {$remainingWithoutWallets} users still without wallets. Check errors above.");
            return self::FAILURE;
        }
    }
}
