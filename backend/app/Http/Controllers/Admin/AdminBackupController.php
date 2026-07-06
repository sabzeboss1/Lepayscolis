<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminBackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBackupController extends Controller
{
    public function __construct(private AdminBackupService $backupService) {}

    /**
     * GET /api/admin/backups/settings
     */
    public function settings(): JsonResponse
    {
        return response()->json([
            'data' => $this->backupService->getBackupSettings(),
        ]);
    }

    /**
     * PUT /api/admin/backups/settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'backup_enabled'            => 'sometimes|boolean',
            'backup_schedule_frequency' => 'sometimes|string|in:hourly,daily,weekly,monthly',
            'backup_schedule_time'      => 'sometimes|string|date_format:H:i',
            'backup_schedule_day'       => 'sometimes|integer|min:1|max:28',
            'backup_include_files'      => 'sometimes|boolean',
            'backup_include_db'         => 'sometimes|boolean',
            'backup_retention_days'     => 'sometimes|integer|min:1|max:365',
            'backup_max_count'          => 'sometimes|integer|min:1|max:100',
            'backup_notify_email'       => ['sometimes', 'nullable', 'string', function ($attribute, $value, $fail) {
                if (!$value) return;
                $emails = array_map('trim', explode(',', $value));
                foreach ($emails as $email) {
                    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        $fail("L'adresse « {$email} » n'est pas un email valide.");
                    }
                }
            }],
            'google_drive_client_id'     => 'sometimes|nullable|string',
            'google_drive_client_secret' => 'sometimes|nullable|string',
            'google_drive_folder_name'   => 'sometimes|nullable|string|max:255',
            'google_drive_folder_id'     => 'sometimes|nullable|string|max:255',
        ]);

        $settings = $this->backupService->updateBackupSettings($validated, $request->user());

        return response()->json([
            'message' => 'Configuration de sauvegarde mise à jour.',
            'data'    => $settings,
        ]);
    }

    /**
     * GET /api/admin/backups
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);
        $backups = $this->backupService->getBackupHistory($perPage);

        return response()->json([
            'data' => $backups->items(),
            'meta' => [
                'current_page' => $backups->currentPage(),
                'last_page'    => $backups->lastPage(),
                'per_page'     => $backups->perPage(),
                'total'        => $backups->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/backups/run
     */
    public function run(Request $request): JsonResponse
    {
        $backup = $this->backupService->triggerManualBackup($request->user());

        return response()->json([
            'message' => 'Sauvegarde lancée en arrière-plan.',
            'data'    => $backup,
        ], 201);
    }

    /**
     * DELETE /api/admin/backups/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->backupService->deleteBackup($id, $request->user());

        return response()->json([
            'message' => 'Sauvegarde supprimée.',
        ]);
    }

    /**
     * GET /api/admin/backups/google-drive/auth-url
     */
    public function googleDriveAuthUrl(): JsonResponse
    {
        $url = $this->backupService->generateGoogleDriveAuthUrl();

        return response()->json([
            'data' => ['url' => $url],
        ]);
    }

    /**
     * POST /api/admin/backups/google-drive/callback
     */
    public function googleDriveCallback(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $this->backupService->handleGoogleDriveCallback($request->input('code'));

        return response()->json([
            'message' => 'Google Drive connecté avec succès.',
        ]);
    }

    /**
     * POST /api/admin/backups/google-drive/test
     */
    public function testGoogleDriveConnection(): JsonResponse
    {
        $result = $this->backupService->testGoogleDriveConnection();

        return response()->json([
            'data' => $result,
        ], $result['connected'] ? 200 : 422);
    }

    /**
     * POST /api/admin/backups/google-drive/create-folder
     */
    public function createGoogleDriveFolder(): JsonResponse
    {
        $folderId = $this->backupService->createDriveFolder();

        return response()->json([
            'message' => 'Dossier créé sur Google Drive.',
            'data'    => ['folder_id' => $folderId],
        ], 201);
    }
}
