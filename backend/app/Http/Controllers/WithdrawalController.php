<?php

namespace App\Http\Controllers;

use App\Exceptions\DuplicatePendingWithdrawalException;
use App\Exceptions\InsufficientBalanceException;
use App\Exceptions\InvalidWithdrawalStatusException;
use App\Exceptions\MinimumWithdrawalException;
use App\Http\Requests\Withdrawal\CreateWithdrawalRequest;
use App\Http\Resources\WithdrawalRequestResource;
use App\Models\WithdrawalRequest;
use App\Services\WithdrawalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WithdrawalController extends Controller
{
    public function __construct(
        private WithdrawalService $withdrawalService
    ) {}

    /**
     * Create a new withdrawal request
     */
    public function store(CreateWithdrawalRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $amount = $request->input('amount');
            $countryCode = $request->input('country_code');
            $currency = $request->input('currency');
            $paymentMethod = $request->input('payment_method');
            $paymentDetails = $request->input('payment_details');

            $withdrawal = $this->withdrawalService->createWithdrawalRequest(
                $user,
                $amount,
                $countryCode,
                $currency,
                $paymentMethod,
                $paymentDetails
            );

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request created successfully',
                'data' => new WithdrawalRequestResource($withdrawal),
            ], 201);
        } catch (DuplicatePendingWithdrawalException $e) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending withdrawal request',
            ], 422);
        } catch (MinimumWithdrawalException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (InsufficientBalanceException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient balance for withdrawal',
            ], 422);
        }
    }

    /**
     * Get authenticated user's withdrawal requests
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $status = $request->input('status');
        $perPage = $request->input('per_page', 20);

        $query = WithdrawalRequest::where('user_id', $user->id)
            ->with(['approver'])
            ->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        $withdrawals = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => WithdrawalRequestResource::collection($withdrawals->items()),
            'meta' => [
                'current_page' => $withdrawals->currentPage(),
                'last_page' => $withdrawals->lastPage(),
                'per_page' => $withdrawals->perPage(),
                'total' => $withdrawals->total(),
            ],
        ]);
    }

    /**
     * Get a specific withdrawal request
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        
        $withdrawal = WithdrawalRequest::where('id', $id)
            ->where('user_id', $user->id)
            ->with(['approver'])
            ->first();

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new WithdrawalRequestResource($withdrawal),
        ]);
    }

    /**
     * Cancel a pending withdrawal request
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        
        $withdrawal = WithdrawalRequest::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request not found',
            ], 404);
        }

        try {
            $this->withdrawalService->cancelWithdrawal($withdrawal);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request cancelled successfully',
            ], 204);
        } catch (InvalidWithdrawalStatusException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel withdrawal in current status',
            ], 422);
        }
    }
}
