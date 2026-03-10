<?php

namespace App\Exceptions;

use Exception;

class DuplicatePendingWithdrawalException extends Exception
{
    /**
     * Create a new exception instance.
     *
     * @param string|null $existingWithdrawalId The ID of the existing pending withdrawal
     * @return void
     */
    public function __construct(?string $existingWithdrawalId = null)
    {
        $message = 'You already have a pending withdrawal request. Please wait for it to be processed or cancel it before creating a new one.';
        
        if ($existingWithdrawalId) {
            $message .= sprintf(' (Existing withdrawal ID: %s)', $existingWithdrawalId);
        }
        
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
            'error' => 'duplicate_pending_withdrawal',
        ], 422);
    }
}
