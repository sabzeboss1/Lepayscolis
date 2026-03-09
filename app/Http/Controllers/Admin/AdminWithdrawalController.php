<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveWithdrawalRequest;
use App\Http\Requests\Admin\RejectWithdrawalRequest;
use App\Http\Resources\Admin\WithdrawalRequestResource;
use App\Services\Admin\AdminWithdrawalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminWithdrawalController extends Controller
{
    protected AdminWithdrawalService $withdrawalService;

    public function __construct(AdminWithdrawalService $withdrawalService)
    {
        $this->withdrawalService = $withdrawalService;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'date_from', 'date_to']);
        $perPage = $request->input('per_page', 50);

        $withdrawals = $this->withdrawalService->getWithdrawals($filters, $perPage);

        return response()->json([
            'data' => WithdrawalRequestResource::collection($withdrawals),
            'meta' => [
                'current_page' => $withdrawals->currentPage(),
                'last_page' => $withdrawals->lastPage(),
                'per_page' => $withdrawals->perPage(),
                'total' => $withdrawals->total(),
            ],
        ], 200);
    }

    public function show(int $id): JsonResponse
    {
        $withdrawal = $this->withdrawalService->getWithdrawalDetails($id);

        return response()->json(['data' => new WithdrawalRequestResource($withdrawal)], 200);
    }

    public function approve(ApproveWithdrawalRequest $request, int $id): JsonResponse
    {
        $this->withdrawalService->approveWithdrawal($id, $request->user());

        return response()->json(['message' => 'Withdrawal approved successfully'], 200);
    }

    public function reject(RejectWithdrawalRequest $request, int $id): JsonResponse
    {
        $this->withdrawalService->rejectWithdrawal($id, $request->reason, $request->user());

        return response()->json(['message' => 'Withdrawal rejected successfully'], 200);
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $this->withdrawalService->completeWithdrawal($id, $request->user());

        return response()->json(['message' => 'Withdrawal completed successfully'], 200);
    }
}
