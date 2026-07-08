<?php

namespace App\Services\Admin;

use App\Enums\BackupStatus;
use App\Enums\BackupType;
use App\Jobs\RunBackupJob;
use App\Models\AuditLog;
use App\Models\Backup;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class AdminBackupService
{
    // ─── Settings ────────────────────────────────────────────

    public function getBackupSettings(): array
    {
        return [
            'backup_enabled'              => (bool) PlatformSetting::get('backup_enabled', false),
            'backup_schedule_frequency'   => PlatformSetting::get('backup_schedule_frequency', 'daily'),
            'backup_schedule_time'        => PlatformSetting::get('backup_schedule_time', '02:00'),
            'backup_schedule_day'         => (int) PlatformSetting::get('backup_schedule_day', 1),
            'backup_include_files'        => (bool) PlatformSetting::get('backup_include_files', true),
            'backup_include_db'           => (bool) PlatformSetting::get('backup_include_db', true),
            'backup_retention_days'       => (int) PlatformSetting::get('backup_retention_days', 30),
            'backup_max_count'            => (int) PlatformSetting::get('backup_max_count', 10),
            'backup_notify_email'         => PlatformSetting::get('backup_notify_email', ''),
            'google_drive_client_id'      => PlatformSetting::get('google_drive_client_id', ''),
            'google_drive_folder_name'    => PlatformSetting::get('google_drive_folder_name', 'LePaysExpressColis-Backups'),
            'google_drive_folder_id'      => PlatformSetting::get('google_drive_folder_id', ''),
            'google_drive_connected'      => (bool) PlatformSetting::get('google_drive_connected', false),
            // Secrets are returned as masked (non-empty = configured)
            'google_drive_client_secret_set'  => PlatformSetting::get('google_drive_client_secret', '') !== '',
            'google_drive_refresh_token_set'  => PlatformSetting::get('google_drive_refresh_token', '') !== '',
        ];
    }

    public function updateBackupSettings(array $data, User $admin): array
    {
        $before = $this->getBackupSettings();

        $settingsMap = [
            'backup_enabled'            => 'backup_enabled',
            'backup_schedule_frequency' => 'backup_schedule_frequency',
            'backup_schedule_time'      => 'backup_schedule_time',
            'backup_schedule_day'       => 'backup_schedule_day',
            'backup_include_files'      => 'backup_include_files',
            'backup_include_db'         => 'backup_include_db',
            'backup_retention_days'     => 'backup_retention_days',
            'backup_max_count'          => 'backup_max_count',
            'backup_notify_email'       => 'backup_notify_email',
            'google_drive_client_id'    => 'google_drive_client_id',
            'google_drive_folder_name'  => 'google_drive_folder_name',
            'google_drive_folder_id'    => 'google_drive_folder_id',
        ];

        foreach ($settingsMap as $input => $key) {
            if (array_key_exists($input, $data)) {
                PlatformSetting::set($key, $data[$input], $admin->id);
            }
        }

        // Encrypt secrets before storing
        if (!empty($data['google_drive_client_secret'])) {
            PlatformSetting::set('google_drive_client_secret', Crypt::encryptString($data['google_drive_client_secret']), $admin->id);
        }

        $after = $this->getBackupSettings();

        AuditLog::log($admin, 'update', 'backup_settings', 0, $before, $after);

        return $after;
    }

    // ─── History ─────────────────────────────────────────────

    public function getBackupHistory(int $perPage = 15): LengthAwarePaginator
    {
        return Backup::with('triggeredBy:id,name')
            ->recent()
            ->paginate($perPage);
    }

    // ─── Trigger ─────────────────────────────────────────────

    public function triggerManualBackup(User $admin): Backup
    {
        $backup = Backup::create([
            'file_name'    => 'lepayscolis-' . now()->format('Y-m-d-His') . '.zip',
            'status'       => BackupStatus::Pending,
            'type'         => BackupType::Manual,
            'triggered_by' => $admin->id,
        ]);

        AuditLog::log($admin, 'create', 'backup', $backup->id, null, [
            'type' => 'manual',
        ]);

        RunBackupJob::dispatch($backup);

        return $backup;
    }

    public function triggerScheduledBackup(): Backup
    {
        $backup = Backup::create([
            'file_name' => 'lepayscolis-' . now()->format('Y-m-d-His') . '.zip',
            'status'    => BackupStatus::Pending,
            'type'      => BackupType::Scheduled,
        ]);

        RunBackupJob::dispatch($backup);

        return $backup;
    }

    // ─── Delete ──────────────────────────────────────────────

    public function deleteBackup(int $id, User $admin): void
    {
        $backup = Backup::findOrFail($id);

        // Delete from Google Drive if file exists there
        if ($backup->google_drive_file_id) {
            try {
                $client = $this->getGoogleDriveClient();
                $driveService = new \Google\Service\Drive($client);
                $driveService->files->delete($backup->google_drive_file_id);
            } catch (\Exception $e) {
                Log::warning("Failed to delete backup from Drive: {$e->getMessage()}", [
                    'backup_id'      => $backup->id,
                    'drive_file_id'  => $backup->google_drive_file_id,
                ]);
            }
        }

        AuditLog::log($admin, 'delete', 'backup', $backup->id, [
            'file_name' => $backup->file_name,
            'file_size' => $backup->file_size,
        ]);

        $backup->delete();
    }

    // ─── Google Drive ────────────────────────────────────────

    public function getGoogleDriveClient(): \Google\Client
    {
        $client = new \Google\Client();
        $client->setClientId(PlatformSetting::get('google_drive_client_id', ''));

        $encryptedSecret = PlatformSetting::get('google_drive_client_secret', '');
        if ($encryptedSecret) {
            $client->setClientSecret(Crypt::decryptString($encryptedSecret));
        }

        $client->setAccessType('offline');
        $client->addScope(\Google\Service\Drive::DRIVE_FILE);

        $encryptedRefreshToken = PlatformSetting::get('google_drive_refresh_token', '');
        if ($encryptedRefreshToken) {
            $refreshToken = Crypt::decryptString($encryptedRefreshToken);
            $token = $client->fetchAccessTokenWithRefreshToken($refreshToken);

            // Google may rotate the refresh token — persist the new one
            if (isset($token['refresh_token']) && $token['refresh_token'] !== $refreshToken) {
                PlatformSetting::set('google_drive_refresh_token', Crypt::encryptString($token['refresh_token']));
                Log::info('Google Drive refresh token rotated and saved.');
            }

            if (isset($token['error'])) {
                Log::error('Google Drive token refresh failed', $token);
                throw new \RuntimeException("Google Drive auth error: {$token['error_description']}");
            }
        }

        return $client;
    }

    public function createDriveFolder(): string
    {
        $client = $this->getGoogleDriveClient();
        $driveService = new \Google\Service\Drive($client);

        $folderName = PlatformSetting::get('google_drive_folder_name', 'LePaysExpressColis-Backups');

        $folder = new \Google\Service\Drive\DriveFile([
            'name'     => $folderName,
            'mimeType' => 'application/vnd.google-apps.folder',
        ]);

        $created = $driveService->files->create($folder, ['fields' => 'id']);

        PlatformSetting::set('google_drive_folder_id', $created->id);

        return $created->id;
    }

    public function testGoogleDriveConnection(): array
    {
        try {
            $client = $this->getGoogleDriveClient();
            $driveService = new \Google\Service\Drive($client);
            $about = $driveService->about->get(['fields' => 'user']);

            PlatformSetting::set('google_drive_connected', true);

            return [
                'connected' => true,
                'email'     => $about->getUser()->getEmailAddress(),
            ];
        } catch (\Exception $e) {
            PlatformSetting::set('google_drive_connected', false);

            return [
                'connected' => false,
                'error'     => $e->getMessage(),
            ];
        }
    }

    public function generateGoogleDriveAuthUrl(): string
    {
        $clientId = PlatformSetting::get('google_drive_client_id', '');
        $encryptedSecret = PlatformSetting::get('google_drive_client_secret', '');

        if (!$clientId || !$encryptedSecret) {
            throw new \RuntimeException('Client ID et Client Secret doivent être configurés avant de connecter Google Drive.');
        }

        $client = new \Google\Client();
        $client->setClientId($clientId);
        $client->setClientSecret(Crypt::decryptString($encryptedSecret));
        $client->setRedirectUri(config('app.frontend_url') . '/admin/backups/google-drive/callback');
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->addScope(\Google\Service\Drive::DRIVE_FILE);

        return $client->createAuthUrl();
    }

    public function handleGoogleDriveCallback(string $code): void
    {
        $clientId = PlatformSetting::get('google_drive_client_id', '');
        $encryptedSecret = PlatformSetting::get('google_drive_client_secret', '');

        if (!$clientId || !$encryptedSecret) {
            throw new \RuntimeException('Client ID et Client Secret manquants.');
        }

        $client = new \Google\Client();
        $client->setClientId($clientId);
        $client->setClientSecret(Crypt::decryptString($encryptedSecret));
        $client->setRedirectUri(config('app.frontend_url') . '/admin/backups/google-drive/callback');

        $token = $client->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            throw new \RuntimeException("Google OAuth error: {$token['error_description']}");
        }

        if (isset($token['refresh_token'])) {
            PlatformSetting::set('google_drive_refresh_token', Crypt::encryptString($token['refresh_token']));
        }

        PlatformSetting::set('google_drive_connected', true);
    }

    // ─── Cleanup ─────────────────────────────────────────────

    public function cleanOldBackups(): int
    {
        $retentionDays = (int) PlatformSetting::get('backup_retention_days', 30);
        $maxCount      = (int) PlatformSetting::get('backup_max_count', 10);

        $deleted = 0;

        // Delete backups older than retention period
        $expired = Backup::where('status', BackupStatus::Completed)
            ->where('created_at', '<', now()->subDays($retentionDays))
            ->get();

        foreach ($expired as $backup) {
            $this->deleteBackupFile($backup);
            $backup->delete();
            $deleted++;
        }

        // Keep only max_count most recent completed backups
        $excess = Backup::where('status', BackupStatus::Completed)
            ->orderBy('created_at', 'desc')
            ->skip($maxCount)
            ->take(100)
            ->get();

        foreach ($excess as $backup) {
            $this->deleteBackupFile($backup);
            $backup->delete();
            $deleted++;
        }

        return $deleted;
    }

    private function deleteBackupFile(Backup $backup): void
    {
        if (!$backup->google_drive_file_id) {
            return;
        }

        try {
            $client = $this->getGoogleDriveClient();
            $driveService = new \Google\Service\Drive($client);
            $driveService->files->delete($backup->google_drive_file_id);
        } catch (\Exception $e) {
            Log::warning("Failed to delete old backup from Drive: {$e->getMessage()}", [
                'backup_id' => $backup->id,
            ]);
        }
    }
}
