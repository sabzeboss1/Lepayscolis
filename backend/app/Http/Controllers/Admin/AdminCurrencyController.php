<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCurrencyRequest;
use App\Http\Requests\Admin\UpdateCurrencyRequest;
use App\Models\Currency;
use App\Services\CurrencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminCurrencyController extends Controller
{
    public function __construct(
        private CurrencyService $currencyService
    ) {}

    /**
     * GET /api/admin/currencies
     * List all currencies (active and inactive).
     */
    public function index(): JsonResponse
    {
        $currencies = Currency::orderBy('code')->get();

        return response()->json([
            'data' => $currencies,
            'meta' => [
                'total' => $currencies->count(),
                'active' => $currencies->where('is_active', true)->count(),
                'base_currency' => $currencies->firstWhere('is_base', true)?->code,
            ],
        ]);
    }

    /**
     * POST /api/admin/currencies
     * Create a new currency.
     */
    public function store(StoreCurrencyRequest $request): JsonResponse
    {
        $currency = $this->currencyService->createCurrency($request->validated());

        Log::info('Currency created by admin', [
            'code' => $currency->code,
            'admin_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => __('messages.currency.created'),
            'data' => $currency,
        ], 201);
    }

    /**
     * PUT /api/admin/currencies/{code}
     * Update a currency.
     */
    public function update(UpdateCurrencyRequest $request, string $code): JsonResponse
    {
        $currency = Currency::where('code', $code)->firstOrFail();

        // Prevent changing base currency rate
        if ($currency->is_base && $request->has('exchange_rate') && (float) $request->exchange_rate !== 1.0) {
            return response()->json([
                'message' => __('messages.currency.cannot_update_base_rate'),
            ], 422);
        }

        // Prevent deactivating base currency
        if ($currency->is_base && $request->has('is_active') && !$request->is_active) {
            return response()->json([
                'message' => __('messages.currency.cannot_deactivate_base'),
            ], 422);
        }

        $currency->update($request->validated());
        $this->currencyService->clearCache();

        Log::info('Currency updated by admin', [
            'code' => $currency->code,
            'changes' => $request->validated(),
            'admin_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => __('messages.currency.updated'),
            'data' => $currency->fresh(),
        ]);
    }

    /**
     * PUT /api/admin/currencies/{code}/rate
     * Quick update exchange rate only.
     */
    public function updateRate(Request $request, string $code): JsonResponse
    {
        $request->validate([
            'exchange_rate' => ['required', 'numeric', 'gt:0'],
        ]);

        try {
            $currency = $this->currencyService->updateExchangeRate(
                $code,
                (float) $request->exchange_rate
            );

            Log::info('Currency rate updated by admin', [
                'code' => $code,
                'new_rate' => $request->exchange_rate,
                'admin_id' => $request->user()->id,
            ]);

            return response()->json([
                'message' => __('messages.currency.rate_updated'),
                'data' => $currency,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/admin/currencies/{code}/toggle
     * Toggle active/inactive status.
     */
    public function toggle(string $code): JsonResponse
    {
        $currency = Currency::where('code', $code)->firstOrFail();

        try {
            $currency = $this->currencyService->toggleActive($code, !$currency->is_active);

            Log::info('Currency toggled by admin', [
                'code' => $code,
                'is_active' => $currency->is_active,
                'admin_id' => request()->user()->id,
            ]);

            return response()->json([
                'message' => $currency->is_active
                    ? __('messages.currency.activated')
                    : __('messages.currency.deactivated'),
                'data' => $currency,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * DELETE /api/admin/currencies/{code}
     * Delete a currency (only if not used by any user/trip/payment/wallet).
     */
    public function destroy(string $code): JsonResponse
    {
        $currency = Currency::where('code', $code)->firstOrFail();

        // Prevent deleting base currency
        if ($currency->is_base) {
            return response()->json([
                'message' => __('messages.currency.cannot_delete_base'),
            ], 422);
        }

        // Check if currency is in use
        $usageCount = DB::table('users')->where('currency_code', $code)->count()
            + DB::table('trips')->where('currency_code', $code)->count()
            + DB::table('payments')->where('currency_code', $code)->count()
            + DB::table('wallets')->where('currency_code', $code)->count();

        if ($usageCount > 0) {
            return response()->json([
                'message' => __('messages.currency.in_use', ['count' => $usageCount]),
            ], 422);
        }

        $currency->delete();
        $this->currencyService->clearCache();

        Log::info('Currency deleted by admin', [
            'code' => $code,
            'admin_id' => request()->user()->id,
        ]);

        return response()->json([
            'message' => __('messages.currency.deleted'),
        ]);
    }
}
