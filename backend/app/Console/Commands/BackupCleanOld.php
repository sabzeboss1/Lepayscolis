<?php

namespace App\Console\Commands;

use App\Services\Admin\AdminBackupService;
use Illuminate\Console\Command;

class BackupCleanOld extends Command
{
    protected $signature = 'backup:clean-old';
    protected $description = 'Supprime les sauvegardes dépassant la politique de rétention';

    public function handle(AdminBackupService $backupService): int
    {
        $deleted = $backupService->cleanOldBackups();

        $this->info("{$deleted} sauvegarde(s) supprimée(s).");

        return Command::SUCCESS;
    }
}
