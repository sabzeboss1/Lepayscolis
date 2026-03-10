<?php

namespace App\Events;

use App\Models\WithdrawalRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event dispatched when a withdrawal request is completed.
 * 
 * This event is triggered when an admin marks a withdrawal as completed,
 * indicating that the funds have been disbursed to the user. The wallet
 * balance is debited at this point.
 * 
 * @see \App\Services\WithdrawalService::completeWithdrawal()
 */
class WithdrawalCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param WithdrawalRequest $withdrawal The withdrawal request that was completed
     */
    public function __construct(public WithdrawalRequest $withdrawal)
    {
    }
}
