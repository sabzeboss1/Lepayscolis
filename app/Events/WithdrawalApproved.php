<?php

namespace App\Events;

use App\Models\WithdrawalRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event dispatched when an administrator approves a withdrawal request.
 * 
 * This event is triggered when an admin reviews and approves a pending
 * withdrawal request. It notifies the user that their withdrawal has been
 * approved and will be processed.
 * 
 * @see \App\Services\WithdrawalService::approveWithdrawal()
 */
class WithdrawalApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param WithdrawalRequest $withdrawal The withdrawal request that was approved
     */
    public function __construct(public WithdrawalRequest $withdrawal)
    {
    }
}
