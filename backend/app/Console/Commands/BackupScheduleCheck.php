<?php

namespace App\Console\Commands;

use App\Models\PlatformSetting;
use App\Services\Admin\AdminBackupService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class BackupScheduleCheck extends Command
{
    protected $signature = 'backup:schedule-check';
    protected $description = 'Vérifie si une sauvegarde planifiée doit être lancée';

    public function handle(AdminBackupService $backupService): int
    {
        $enabled = (bool) PlatformSetting::get('backup_enabled', false);

        if (!$enabled) {
            Log::debug('backup:schedule-check — backups disabled, skipping.');
            return Command::SUCCESS;
        }

        $frequency = PlatformSetting::get('backup_schedule_frequency', 'daily');
        $time      = PlatformSetting::get('backup_schedule_time', '02:00');
        $day       = (int) PlatformSetting::get('backup_schedule_day', 1);

        $now = now();
        [$hour, $minute] = explode(':', $time);
        $scheduledHour   = (int) $hour;
        $scheduledMinute = (int) $minute;
        $currentHour     = (int) $now->format('H');
        $currentMinute   = (int) $now->format('i');

        Log::info('backup:schedule-check — evaluating', [
            'now_utc'          => $now->format('Y-m-d H:i:s'),
            'timezone'         => config('app.timezone'),
            'scheduled_time'   => sprintf('%02d:%02d', $scheduledHour, $scheduledMinute),
            'current_time'     => sprintf('%02d:%02d', $currentHour, $currentMinute),
            'frequency'        => $frequency,
            'day_setting'      => $day,
            'current_day_iso'  => $now->dayOfWeekIso,
            'current_day_month'=> $now->day,
        ]);

        // Only run if current hour matches
        if ($currentHour !== $scheduledHour) {
            Log::info("backup:schedule-check — hour mismatch ({$currentHour} !== {$scheduledHour}), skipping.");
            return Command::SUCCESS;
        }

        // Only run within 5 minutes after the scheduled minute
        if ($currentMinute < $scheduledMinute || $currentMinute > $scheduledMinute + 4) {
            Log::info("backup:schedule-check — minute outside window (current={$currentMinute}, scheduled={$scheduledMinute}-" . ($scheduledMinute + 4) . "), skipping.");
            return Command::SUCCESS;
        }

        $shouldRun = match ($frequency) {
            'hourly'  => true,
            'daily'   => true,
            'weekly'  => $now->dayOfWeekIso === $day,
            'monthly' => $now->day === $day,
            default   => false,
        };

        if (!$shouldRun) {
            Log::info("backup:schedule-check — frequency '{$frequency}' condition not met (day={$day}, current_iso={$now->dayOfWeekIso}, current_day={$now->day}), skipping.");
            return Command::SUCCESS;
        }

        Log::info('backup:schedule-check — ALL conditions met, dispatching backup job.');
        $backupService->triggerScheduledBackup();
        $this->info('Sauvegarde planifiée lancée.');

        return Command::SUCCESS;
    }
}
