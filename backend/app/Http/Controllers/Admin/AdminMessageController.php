<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DeleteMessageRequest;
use App\Http\Resources\Admin\AdminConversationResource;
use App\Http\Resources\MessageResource;
use App\Services\Admin\AdminMessagingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMessageController extends Controller
{
    protected AdminMessagingService $messagingService;

    public function __construct(AdminMessagingService $messagingService)
    {
        $this->messagingService = $messagingService;
    }

    public function conversations(Request $request): JsonResponse
    {
        $filters = $request->only(['search']);
        $perPage = $request->input('per_page', 50);

        $conversations = $this->messagingService->getConversations($filters, $perPage);

        return response()->json([
            'data' => AdminConversationResource::collection($conversations),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
            ],
        ], 200);
    }

    public function show(string $id): JsonResponse
    {
        $data = $this->messagingService->getConversationMessages($id);

        return response()->json([
            'data' => [
                'conversation' => new AdminConversationResource($data['conversation']),
                'messages' => MessageResource::collection($data['messages']),
            ],
        ], 200);
    }

    public function destroy(DeleteMessageRequest $request, string $id): JsonResponse
    {
        $this->messagingService->deleteMessage($id, $request->reason, $request->user());

        return response()->json(null, 204);
    }
}
