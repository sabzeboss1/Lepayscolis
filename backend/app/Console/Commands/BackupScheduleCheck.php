<?php

namespace App\Console\Commands;

use App\Models\PlatformSetting;
use App\Services\Admin\AdminBackupService;
use Illuminate\Console\Command;

class BackupScheduleCheck extends Command
{
    protected $signature = 'backup:schedule-check';
    protected $description = 'Vérifie si une sauvegarde planifiée doit être lancée';

    public function handle(AdminBackupService $backupService): int
    {
        if (!(bool) PlatformSetting::get('backup_enabled', false)) {
            return Command::SUCCESS;
        }

        $frequency = PlatformSetting::get('backup_schedule_frequency', 'daily');
        $time      = PlatformSetting::get('backup_schedule_time', '02:00');
        $day       = (int) PlatformSetting::get('backup_schedule_day', 1);

        $now = now();
        [$hour, $minute] = explode(':', $time);

        // Only run within the scheduled hour
        if ((int) $now->format('H') !== (int) $hour) {
            return Command::SUCCESS;
        }

        // Only run in the first 10 minutes of the hour to avoid duplicates
        if ((int) $now->format('i') > 10) {
            return Command::SUCCESS;
        }

        $shouldRun = match ($frequency) {
            'hourly'  => true,
            'daily'   => true, // Already filtered by hour above
            'weekly'  => $now->dayOfWeekIso === $day,
            'monthly' => $now->day === $day,
            default   => false,
        };

        if (!$shouldRun) {
            return Command::SUCCESS;
        }

        $backupService->triggerScheduledBackup();
        $this->info('Sauvegarde planifiée lancée.');

        return Command::SUCCESS;
    }
}
