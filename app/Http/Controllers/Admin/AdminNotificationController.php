<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SendNotificationRequest;
use App\Services\Admin\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    protected AdminNotificationService $notificationService;

    public function __construct(AdminNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function send(SendNotificationRequest $request): JsonResponse
    {
        $result = match ($request->recipient_type) {
            'individual' => $this->notificationService->sendNotification(
                $request->user_id,
                $request->title,
                $request->message,
                $request->user()
            ),
            'broadcast' => $this->notificationService->sendBroadcast(
                $request->title,
                $request->message,
                $request->user()
            ),
            'group' => $this->notificationService->sendToGroup(
                $request->title,
                $request->message,
                $request->group_filter,
                $request->user()
            ),
        };

        return response()->json([
            'message' => 'Notification sent successfully',
            'recipient_count' => $result['recipient_count'],
        ], 200);
    }

    public function history(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 50);
        
        $history = $this->notificationService->getNotificationHistory($perPage);

        return response()->json([
            'data' => $history->items(),
            'meta' => [
                'current_page' => $history->currentPage(),
                'last_page' => $history->lastPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
            ],
        ], 200);
    }
}
