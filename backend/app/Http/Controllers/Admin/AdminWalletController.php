<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdjustBalanceRequest;
use App\Http\Resources\Admin\WalletResource;
use App\Services\Admin\AdminWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminWalletController extends Controller
{
    protected AdminWalletService $walletService;

    public function __construct(AdminWalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'sort']);
        $perPage = $request->input('per_page', 50);

        $wallets = $this->walletService->getWallets($filters, $perPage);

        return response()->json([
            'data' => WalletResource::collection($wallets),
            'meta' => [
                'current_page' => $wallets->currentPage(),
                'last_page' => $wallets->lastPage(),
                'per_page' => $wallets->perPage(),
                'total' => $wallets->total(),
            ],
        ], 200);
    }

    public function show(int $userId): JsonResponse
    {
        $wallet = $this->walletService->getWalletDetails($userId);

        return response()->json(['data' => $wallet], 200);
    }

    public function adjustBalance(AdjustBalanceRequest $request, int $userId): JsonResponse
    {
        $this->walletService->adjustBalance(
            $userId,
            $request->amount,
            $request->reason,
            $request->type,
            $request->user()
        );

        return response()->json([
            'message' => 'Balance adjusted successfully',
        ], 200);
    }
}
