<?php

namespace App\Console\Commands;

use App\Models\PlatformSetting;
use App\Services\Admin\AdminBackupService;
use Carbon\Carbon;
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
        $tz        = PlatformSetting::get('backup_timezone', 'UTC');

        // Convert scheduled time from admin's timezone to UTC
        [$hour, $minute] = explode(':', $time);
        $scheduledLocal = Carbon::createFromTime((int) $hour, (int) $minute, 0, $tz);
        $scheduledUtc   = $scheduledLocal->utc();

        $nowUtc       = Carbon::now('UTC');
        $currentHour  = (int) $nowUtc->format('H');
        $currentMinute = (int) $nowUtc->format('i');
        $targetHour   = (int) $scheduledUtc->format('H');
        $targetMinute = (int) $scheduledUtc->format('i');

        // For frequency checks, use the admin's local "now"
        $nowLocal = Carbon::now($tz);

        Log::info('backup:schedule-check — evaluating', [
            'admin_timezone'    => $tz,
            'admin_time'        => sprintf('%02d:%02d', (int) $hour, (int) $minute),
            'converted_utc'     => sprintf('%02d:%02d', $targetHour, $targetMinute),
            'now_utc'           => $nowUtc->format('Y-m-d H:i:s'),
            'now_local'         => $nowLocal->format('Y-m-d H:i:s'),
            'frequency'         => $frequency,
            'day_setting'       => $day,
            'current_day_iso'   => $nowLocal->dayOfWeekIso,
            'current_day_month' => $nowLocal->day,
        ]);

        // Hour must match
        if ($currentHour !== $targetHour) {
            Log::info("backup:schedule-check — hour mismatch (now={$currentHour}, target={$targetHour}), skipping.");
            return Command::SUCCESS;
        }

        // Minute must be within 5-minute window after scheduled minute
        if ($currentMinute < $targetMinute || $currentMinute > $targetMinute + 4) {
            Log::info("backup:schedule-check — minute outside window (now={$currentMinute}, target={$targetMinute}-" . ($targetMinute + 4) . "), skipping.");
            return Command::SUCCESS;
        }

        // Frequency check uses local day
        $shouldRun = match ($frequency) {
            'hourly'  => true,
            'daily'   => true,
            'weekly'  => $nowLocal->dayOfWeekIso === $day,
            'monthly' => $nowLocal->day === $day,
            default   => false,
        };

        if (!$shouldRun) {
            Log::info("backup:schedule-check — frequency '{$frequency}' condition not met (day_setting={$day}, local_iso={$nowLocal->dayOfWeekIso}, local_day={$nowLocal->day}), skipping.");
            return Command::SUCCESS;
        }

        Log::info('backup:schedule-check — ALL conditions met, dispatching backup job.');
        $backupService->triggerScheduledBackup();
        $this->info('Sauvegarde planifiée lancée.');

        return Command::SUCCESS;
    }
}
