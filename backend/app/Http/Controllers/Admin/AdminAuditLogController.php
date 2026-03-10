<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AuditLogResource;
use App\Services\Admin\AdminAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditLogController extends Controller
{
    protected AdminAuditService $auditService;

    public function __construct(AdminAuditService $auditService)
    {
        $this->auditService = $auditService;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['admin_id', 'action', 'resource_type', 'resource_id', 'date_from', 'date_to', 'search']);
        $perPage = $request->input('per_page', 50);

        $logs = $this->auditService->getAuditLogs($filters, $perPage);

        return response()->json([
            'data' => AuditLogResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ], 200);
    }

    public function show(int $id): JsonResponse
    {
        $log = \App\Models\AuditLog::with('admin')->findOrFail($id);

        return response()->json(['data' => new AuditLogResource($log)], 200);
    }

    public function export(Request $request): JsonResponse
    {
        $filters = $request->only(['admin_id', 'action', 'resource_type', 'resource_id', 'date_from', 'date_to']);
        
        $result = $this->auditService->exportAuditLogs($filters);

        return response()->json($result, 200);
    }
}
