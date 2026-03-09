<?php

namespace App\Events;

use App\Models\WithdrawalRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event dispatched when a user creates a new withdrawal request.
 * 
 * This event is triggered when a user submits a withdrawal request
 * from their wallet. It notifies administrators that a new withdrawal
 * requires review and approval.
 * 
 * @see \App\Services\WithdrawalService::createWithdrawalRequest()
 */
class WithdrawalRequested
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param WithdrawalRequest $withdrawal The withdrawal request that was created
     */
    public function __construct(public WithdrawalRequest $withdrawal)
    {
    }
}
