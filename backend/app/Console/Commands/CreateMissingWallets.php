<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Console\Command;

class CreateMissingWallets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wallets:create-missing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create wallets for users who do not have one';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Checking for users without wallets...');

        // Get all users who don't have a wallet
        $usersWithoutWallet = User::doesntHave('wallet')->get();

        if ($usersWithoutWallet->isEmpty()) {
            $this->info('All users already have wallets!');
            return Command::SUCCESS;
        }

        $this->info("Found {$usersWithoutWallet->count()} users without wallets.");
        
        $bar = $this->output->createProgressBar($usersWithoutWallet->count());
        $bar->start();

        $created = 0;
        foreach ($usersWithoutWallet as $user) {
            try {
                Wallet::create([
                    'user_id' => $user->id,
                    'balance' => 0.00,
                    'currency_code' => $user->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
                    'held_balance' => 0.00,
                ]);
                $created++;
            } catch (\Exception $e) {
                $this->error("\nFailed to create wallet for user {$user->id}: {$e->getMessage()}");
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Successfully created {$created} wallets!");

        return Command::SUCCESS;
    }
}
