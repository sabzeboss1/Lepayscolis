<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Services\Admin\AdminSettingsService;
use Illuminate\Http\JsonResponse;

class AdminSettingsController extends Controller
{
    protected AdminSettingsService $settingsService;

    public function __construct(AdminSettingsService $settingsService)
    {
        $this->settingsService = $settingsService;
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
}
