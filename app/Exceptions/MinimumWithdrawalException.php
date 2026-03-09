<?php

namespace App\Exceptions;

use Exception;

class MinimumWithdrawalException extends Exception
{
    /**
     * Create a new exception instance.
     *
     * @param float $requestedAmount The requested withdrawal amount
     * @param float $minimumAmount The minimum allowed withdrawal amount
     * @return void
     */
    public function __construct(float $requestedAmount, float $minimumAmount = 10.00)
    {
        $message = sprintf(
            'Withdrawal amount %.2f EUR is below the minimum allowed amount of %.2f EUR',
            $requestedAmount,
            $minimumAmount
        );
        
        parent::__construct($message, 422);
    }

    /**
     * Render the exception as an HTTP response.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function render($request)
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error' => 'minimum_withdrawal_not_met',
        ], 422);
    }
}
