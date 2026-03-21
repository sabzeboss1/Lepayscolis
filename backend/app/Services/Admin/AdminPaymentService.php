<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class AdminPaymentService
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function getPayments(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = Payment::with(['payer', 'shipment']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['method'])) {
            $query->where('payment_method', $filters['method']);
        }

        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        return $query->latest('created_at')->paginate($perPage);
    }

    public function getPaymentDetails(string $paymentId): Payment
    {
        return Payment::with(['payer', 'payee', 'shipment'])->findOrFail($paymentId);
    }

    public function processRefund(string $paymentId, string $reason, ?float $amount, User $admin): Payment
    {
        $payment = Payment::findOrFail($paymentId);

        $before = ['status' => $payment->status];

        $refundAmount = $amount ?? $payment->amount;

        $this->paymentService->refundPayment($paymentId, $reason, $refundAmount);

        $after = ['status' => 'refunded', 'refund_amount' => $refundAmount, 'reason' => $reason];

        AuditLog::log($admin, 'refund', 'payment', $paymentId, $before, $after);

        return $payment->fresh();
    }

    public function getPaymentAnalytics(array $filters = []): array
    {
        $cacheKey = 'admin_payment_analytics_' . md5(json_encode($filters));

        return Cache::remember($cacheKey, 3600, function () use ($filters) {
            $query = Payment::query();

            if (!empty($filters['date_from'])) {
                $query->where('created_at', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->where('created_at', '<=', $filters['date_to']);
            }

            $totalRevenue = $query->where('status', 'completed')->sum('amount');
            $transactionVolume = $query->count();
            $successfulTransactions = $query->where('status', 'completed')->count();
            $refundedTransactions = $query->where('status', 'refunded')->count();

            $successRate = $transactionVolume > 0 ? ($successfulTransactions / $transactionVolume) * 100 : 0;
            $refundRate = $transactionVolume > 0 ? ($refundedTransactions / $transactionVolume) * 100 : 0;

            return [
                'total_revenue' => $totalRevenue,
                'transaction_volume' => $transactionVolume,
                'success_rate' => round($successRate, 2),
                'refund_rate' => round($refundRate, 2),
            ];
        });
    }
}
