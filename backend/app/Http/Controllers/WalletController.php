<?php

namespace App\Http\Controllers;

use App\Http\Resources\WalletResource;
use App\Http\Resources\WalletTransactionResource;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(
        private WalletService $walletService
    ) {}

    /**
     * Get authenticated user's wallet balance and summary
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $wallet = $this->walletService->getWallet($user);

        return response()->json([
            'success' => true,
            'data' => new WalletResource($wallet),
        ]);
    }

    /**
     * Get wallet transaction history with pagination and filters
     */
    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();
        $wallet = $this->walletService->getWallet($user);

        $filters = [
            'type' => $request->input('type'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'per_page' => $request->input('per_page', 50),
        ];

        $transactions = $this->walletService->getTransactionHistory($wallet, $filters);

        return response()->json([
            'success' => true,
            'data' => WalletTransactionResource::collection($transactions->items()),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }
}
