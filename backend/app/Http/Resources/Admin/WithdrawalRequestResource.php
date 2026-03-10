<?php

namespace App\Http\Resources\Admin;

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
            'user' => [
                'id' => $this->user_id,
                'name' => $this->user_name ?? 'N/A',
                'email' => $this->user_email ?? 'N/A',
            ],
            'amount' => $this->amount,
            'amount_formatted' => number_format($this->amount, 2) . ' USD',
            'fee' => $this->fee,
            'net_amount' => $this->amount - $this->fee,
            'net_amount_formatted' => number_format($this->amount - $this->fee, 2) . ' USD',
            'bank_details' => [
                'bank_name' => $this->bank_name,
                'account_number' => $this->account_number,
                'account_holder' => $this->account_holder,
            ],
            'status' => $this->status,
            'rejection_reason' => $this->when($this->status === 'rejected', $this->rejection_reason),
            'approved_by' => $this->when($this->approved_by, $this->approved_by),
            'approved_at' => $this->when($this->approved_at, $this->approved_at),
            'completed_at' => $this->when($this->completed_at, $this->completed_at),
            'created_at' => $this->created_at,
        ];
    }
}
