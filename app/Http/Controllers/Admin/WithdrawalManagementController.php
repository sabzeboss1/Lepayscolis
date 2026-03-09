<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\InsufficientBalanceException;
use App\Exceptions\InvalidWithdrawalStatusException;
use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureAdminRole;
use App\Http\Requests\Admin\ApproveWithdrawalRequest;
use App\Http\Requests\Admin\RejectWithdrawalRequest;
use App\Http\Resources\WithdrawalRequestResource;
use App\Models\WithdrawalRequest;
use App\Services\WithdrawalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WithdrawalManagementController extends Controller
{
    public function __construct(
        private WithdrawalService $withdrawalService
    ) {
        $this->middleware('auth:sanctum');
        $this->middleware(EnsureAdminRole::class);
    }

    /**
     * List all withdrawal requests with filters
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $search = $request->input('search');
        $perPage = $request->input('per_page', 20);

        $query = WithdrawalRequest::with(['user', 'approver'])
            ->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo);
        }

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('id', $search);
            });
        }

        $withdrawals = $query->paginate($perPage);

        // Calculate total pending amount
        $totalPending = WithdrawalRequest::where('status', 'pending')
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => WithdrawalRequestResource::collection($withdrawals->items()),
            'meta' => [
                'current_page' => $withdrawals->currentPage(),
                'last_page' => $withdrawals->lastPage(),
                'per_page' => $withdrawals->perPage(),
                'total' => $withdrawals->total(),
                'total_pending_amount' => (float) $totalPending,
                'formatted_total_pending' => number_format($totalPending, 2) . ' EUR',
            ],
        ]);
    }

    /**
     * Approve a withdrawal request
     */
    public function approve(ApproveWithdrawalRequest $request, string $id): JsonResponse
    {
        $withdrawal = WithdrawalRequest::with('user')->find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request not found',
            ], 404);
        }

        try {
            $admin = $request->user();

            $withdrawal = $this->withdrawalService->approveWithdrawal($withdrawal, $admin);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request approved successfully',
                'data' => new WithdrawalRequestResource($withdrawal),
            ]);
        } catch (InvalidWithdrawalStatusException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot approve withdrawal in current status',
            ], 422);
        } catch (InsufficientBalanceException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User has insufficient balance for this withdrawal',
            ], 422);
        }
    }

    /**
     * Reject a withdrawal request
     */
    public function reject(RejectWithdrawalRequest $request, string $id): JsonResponse
    {
        $withdrawal = WithdrawalRequest::with('user')->find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request not found',
            ], 404);
        }

        try {
            $admin = $request->user();
            $reason = $request->input('reason');

            $withdrawal = $this->withdrawalService->rejectWithdrawal($withdrawal, $reason, $admin);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request rejected successfully',
                'data' => new WithdrawalRequestResource($withdrawal),
            ]);
        } catch (InvalidWithdrawalStatusException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reject withdrawal in current status',
            ], 422);
        }
    }

    /**
     * Mark withdrawal as processing
     */
    public function markProcessing(Request $request, string $id): JsonResponse
    {
        $withdrawal = WithdrawalRequest::with('user')->find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request not found',
            ], 404);
        }

        try {
            $admin = $request->user();
            $withdrawal = $this->withdrawalService->markProcessing($withdrawal, $admin);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal marked as processing',
                'data' => new WithdrawalRequestResource($withdrawal),
            ]);
        } catch (InvalidWithdrawalStatusException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot mark withdrawal as processing in current status',
            ], 422);
        }
    }

    /**
     * Complete a withdrawal request
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $withdrawal = WithdrawalRequest::with('user')->find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request not found',
            ], 404);
        }

        try {
            $admin = $request->user();
            $withdrawal = $this->withdrawalService->completeWithdrawal($withdrawal, $admin);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal completed successfully',
                'data' => new WithdrawalRequestResource($withdrawal),
            ]);
        } catch (InvalidWithdrawalStatusException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot complete withdrawal in current status',
            ], 422);
        } catch (InsufficientBalanceException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User has insufficient balance for this withdrawal',
            ], 422);
        }
    }
}
