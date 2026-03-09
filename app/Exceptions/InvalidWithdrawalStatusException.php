<?php

namespace App\Exceptions;

use Exception;

class InvalidWithdrawalStatusException extends Exception
{
    /**
     * Create a new exception instance.
     *
     * @param string $currentStatus The current withdrawal status
     * @param string $attemptedStatus The attempted status transition
     * @return void
     */
    public function __construct(string $currentStatus, string $attemptedStatus)
    {
        $message = sprintf(
            'Invalid withdrawal status transition from "%s" to "%s"',
            $currentStatus,
            $attemptedStatus
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
            'error' => 'invalid_withdrawal_status',
        ], 422);
    }
}
