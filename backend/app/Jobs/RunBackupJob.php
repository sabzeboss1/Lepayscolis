<?php

namespace App\Jobs;

use App\Models\Backup;
use App\Models\PlatformSetting;
use App\Services\Admin\AdminBackupService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class RunBackupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 600;

    public function __construct(public Backup $backup) {}

    public function handle(AdminBackupService $backupService): void
    {
        $this->backup->markInProgress();

        try {
            $includeDb    = (bool) PlatformSetting::get('backup_include_db', true);
            $includeFiles = (bool) PlatformSetting::get('backup_include_files', true);

            // 1. Create ZIP archive
            $zipPath = storage_path('app/backup-temp/' . $this->backup->file_name);
            @mkdir(dirname($zipPath), 0755, true);

            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new \RuntimeException("Impossible de créer l'archive ZIP.");
            }

            // 2. Add database
            if ($includeDb) {
                $this->addDatabase($zip);
            }

            // 3. Add storage files
            if ($includeFiles) {
                $this->addStorageFiles($zip);
            }

            $zip->close();

            $fileSize = filesize($zipPath);
            $zipContent = file_get_contents($zipPath);

            // 4. Upload to Google Drive
            $driveFileId = null;
            $folderId = PlatformSetting::get('google_drive_folder_id', '');

            if ($folderId) {
                $driveFileId = $this->uploadToGoogleDrive($backupService, $zipContent, $this->backup->file_name, $folderId);
            } else {
                Log::warning('Aucun dossier Google Drive configuré — backup conservé localement uniquement.');
            }

            // 5. Mark completed
            $this->backup->markCompleted($fileSize, $driveFileId);

            // 6. Remove local ZIP after successful Drive upload
            if ($driveFileId) {
                @unlink($zipPath);
            }

            // 7. Notify
            $this->notifySuccess();

        } catch (\Throwable $e) {
            Log::error("Backup #{$this->backup->id} failed: {$e->getMessage()}", [
                'trace' => $e->getTraceAsString(),
            ]);

            $this->backup->markFailed($e->getMessage());
            $this->notifyFailure();
        }
    }

    private function addDatabase(ZipArchive $zip): void
    {
        $connection = config('database.default');

        if ($connection === 'sqlite') {
            // Dev: copy the SQLite file directly
            $dbPath = config('database.connections.sqlite.database');
            if ($dbPath && file_exists($dbPath)) {
                $zip->addFile($dbPath, 'database/database.sqlite');
            }
        } else {
            // Prod (mysql): use mysqldump
            $config = config("database.connections.{$connection}");
            $dumpDir = storage_path('app/backup-temp');
            $dumpPath = $dumpDir . '/database.sql';

            $dumpBinary = $config['dump']['dump_binary_path'] ?? '';
            $mysqldump = $dumpBinary ? rtrim($dumpBinary, '/\\') . '/mysqldump' : 'mysqldump';

            $command = sprintf(
                '%s --host=%s --port=%s --user=%s --password=%s %s > %s 2>&1',
                escapeshellarg($mysqldump),
                escapeshellarg($config['host'] ?? '127.0.0.1'),
                escapeshellarg($config['port'] ?? '3306'),
                escapeshellarg($config['username'] ?? 'root'),
                escapeshellarg($config['password'] ?? ''),
                escapeshellarg($config['database'] ?? 'laravel'),
                escapeshellarg($dumpPath)
            );

            exec($command, $output, $exitCode);

            if ($exitCode !== 0) {
                $errorOutput = implode("\n", $output);
                throw new \RuntimeException("mysqldump a échoué (code {$exitCode}): {$errorOutput}");
            }

            $zip->addFile($dumpPath, 'database/database.sql');
        }
    }

    private function addStorageFiles(ZipArchive $zip): void
    {
        $storagePath = storage_path('app/public');

        if (!is_dir($storagePath)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($storagePath, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $relativePath = 'storage/' . substr($file->getRealPath(), strlen($storagePath) + 1);
                $zip->addFile($file->getRealPath(), str_replace('\\', '/', $relativePath));
            }
        }
    }

    private function uploadToGoogleDrive(AdminBackupService $backupService, string $content, string $fileName, string $folderId): string
    {
        $client = $backupService->getGoogleDriveClient();
        $driveService = new \Google\Service\Drive($client);

        $fileMetadata = new \Google\Service\Drive\DriveFile([
            'name'    => $fileName,
            'parents' => [$folderId],
        ]);

        $file = $driveService->files->create($fileMetadata, [
            'data'       => $content,
            'mimeType'   => 'application/zip',
            'uploadType' => 'multipart',
            'fields'     => 'id',
        ]);

        return $file->id;
    }

    private function notifySuccess(): void
    {
        $this->sendBackupEmail('backup-completed', 'Sauvegarde terminée', 'Backup completed');
    }

    private function notifyFailure(): void
    {
        $this->sendBackupEmail('backup-failed', 'Échec de sauvegarde', 'Backup failed');
    }

    private function sendBackupEmail(string $template, string $subjectFr, string $subjectEn): void
    {
        $emails = $this->getNotifyEmails();
        if (empty($emails)) {
            return;
        }

        $platformName = \App\Models\PlatformSetting::get('platform_name', config('app.name'));
        $locale = config('app.locale', 'fr');
        $backup = $this->backup->fresh('triggeredBy');

        $viewData = [
            'backup' => $backup,
            'platformName' => $platformName,
        ];

        $subject = $locale === 'fr' ? $subjectFr : $subjectEn;
        $view = "emails.{$locale}.{$template}";

        // Fallback to fr if locale template doesn't exist
        if (!view()->exists($view)) {
            $view = "emails.fr.{$template}";
            $subject = $subjectFr;
        }

        // Ensure SMTP config is loaded from platform_settings (queue workers cache boot config)
        \App\Providers\MailConfigServiceProvider::applySmtpFromDatabase();

        foreach ($emails as $email) {
            try {
                \Illuminate\Support\Facades\Mail::send($view, $viewData, function ($message) use ($email, $subject, $platformName) {
                    $message->to($email)
                        ->subject("{$subject} — {$platformName}");
                });
            } catch (\Throwable $e) {
                Log::warning("Failed to send backup email to {$email}: {$e->getMessage()}");
            }
        }
    }

    private function getNotifyEmails(): array
    {
        $raw = PlatformSetting::get('backup_notify_email', '');
        return array_filter(array_map('trim', explode(',', $raw)));
    }
}
