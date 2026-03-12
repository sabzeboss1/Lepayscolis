<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WithdrawalRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'amount' => (float) $this->amount,
            'formatted_amount' => $this->formatCurrency($this->amount),
            'fee' => (float) $this->fee,
            'formatted_fee' => $this->formatCurrency($this->fee),
            'net_amount' => (float) $this->net_amount,
            'formatted_net_amount' => $this->formatCurrency($this->net_amount),
            'country_code' => $this->country_code,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method,
            'payment_details' => $this->payment_details,
            'status' => $this->status,
            'status_badge' => $this->getStatusBadge(),
            'rejection_reason' => $this->when($this->status === 'rejected', $this->rejection_reason),
            'approved_by' => $this->when($this->approved_by, [
                'id' => $this->approver?->id,
                'name' => $this->approver?->name,
            ]),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Format currency using CurrencyService for consistency.
     */
    private function formatCurrency(float $amount): string
    {
        return app(\App\Services\CurrencyService::class)->format($amount, $this->currency ?? 'EUR');
    }

    /**
     * Get status badge information
     */
    private function getStatusBadge(): array
    {
        $badges = [
            'pending' => ['color' => 'yellow', 'text' => 'Pending'],
            'approved' => ['color' => 'blue', 'text' => 'Approved'],
            'processing' => ['color' => 'purple', 'text' => 'Processing'],
            'completed' => ['color' => 'green', 'text' => 'Completed'],
            'rejected' => ['color' => 'red', 'text' => 'Rejected'],
            'cancelled' => ['color' => 'gray', 'text' => 'Cancelled'],
        ];

        return $badges[$this->status] ?? ['color' => 'gray', 'text' => ucfirst($this->status)];
    }
}
