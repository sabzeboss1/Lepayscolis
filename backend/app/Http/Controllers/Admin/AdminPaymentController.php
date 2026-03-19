<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProcessRefundRequest;
use App\Http\Resources\Admin\PaymentTransactionResource;
use App\Services\Admin\AdminPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPaymentController extends Controller
{
    protected AdminPaymentService $paymentService;

    public function __construct(AdminPaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'method', 'date_from', 'date_to']);
        $perPage = $request->input('per_page', 50);

        $payments = $this->paymentService->getPayments($filters, $perPage);

        return response()->json([
            'data' => PaymentTransactionResource::collection($payments),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ], 200);
    }

    public function show(string $id): JsonResponse
    {
        $payment = $this->paymentService->getPaymentDetails($id);

        return response()->json(['data' => new PaymentTransactionResource($payment)], 200);
    }

    public function refund(ProcessRefundRequest $request, string $id): JsonResponse
    {
        $payment = $this->paymentService->processRefund(
            $id,
            $request->reason,
            $request->amount,
            $request->user()
        );

        return response()->json([
            'data' => new PaymentTransactionResource($payment),
            'message' => 'Refund processed successfully',
        ], 200);
    }

    public function analytics(Request $request): JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to']);
        $analytics = $this->paymentService->getPaymentAnalytics($filters);

        return response()->json(['data' => $analytics], 200);
    }
}
