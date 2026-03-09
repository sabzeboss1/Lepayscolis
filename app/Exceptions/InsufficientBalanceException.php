<?php

namespace App\Exceptions;

use Exception;

class InsufficientBalanceException extends Exception
{
    /**
     * Create a new exception instance.
     *
     * @param float $required The required amount
     * @param float $available The available balance
     * @return void
     */
    public function __construct(float $required, float $available)
    {
        $message = sprintf(
            'Insufficient balance. Required: %.2f EUR, Available: %.2f EUR',
            $required,
            $available
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
            'error' => 'insufficient_balance',
        ], 422);
    }
}
