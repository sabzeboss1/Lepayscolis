<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\PlatformSetting;
use App\Services\Admin\AdminSettingsService;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminSettingsController extends Controller
{
    protected AdminSettingsService $settingsService;
    protected FileUploadService $fileUploadService;

    public function __construct(AdminSettingsService $settingsService, FileUploadService $fileUploadService)
    {
        $this->settingsService = $settingsService;
        $this->fileUploadService = $fileUploadService;
    }

    public function index(): JsonResponse
    {
        $settings = $this->settingsService->getSettings();

        return response()->json(['data' => $settings], 200);
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $settings = $this->settingsService->updateSettings($request->validated(), $request->user());

        return response()->json([
            'data' => $settings,
            'message' => 'Settings updated successfully',
        ], 200);
    }

    /**
     * Upload a branding asset (logo or favicon).
     */
    public function uploadBrandingAsset(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:2048',
            'type' => 'required|string|in:logo,favicon',
        ]);

        try {
            $url = $this->fileUploadService->uploadBrandingAsset(
                $request->file('file'),
                $request->input('type')
            );

            // Save the URL to platform settings
            $settingKey = $request->input('type') === 'logo' ? 'logo_url' : 'favicon_url';
            PlatformSetting::set($settingKey, $url, $request->user()->id);

            Log::info('Branding asset uploaded', [
                'type' => $request->input('type'),
                'url' => $url,
                'admin_id' => $request->user()->id,
            ]);

            return response()->json([
                'url' => $url,
                'message' => ucfirst($request->input('type')) . ' uploaded successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Branding asset upload failed', [
                'type' => $request->input('type'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
