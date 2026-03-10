<?php

namespace App\Events;

use App\Models\WithdrawalRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event dispatched when an administrator rejects a withdrawal request.
 * 
 * This event is triggered when an admin reviews and rejects a pending
 * withdrawal request. It notifies the user that their withdrawal has been
 * rejected along with the reason for rejection.
 * 
 * @see \App\Services\WithdrawalService::rejectWithdrawal()
 */
class WithdrawalRejected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param WithdrawalRequest $withdrawal The withdrawal request that was rejected
     * @param string $reason The reason for rejection
     */
    public function __construct(
        public WithdrawalRequest $withdrawal,
        public string $reason
    ) {
    }
}
