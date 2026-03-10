<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Minimum Withdrawal Amount
    |--------------------------------------------------------------------------
    |
    | The minimum amount (in EUR) that can be requested for withdrawal.
    | Users cannot create withdrawal requests below this threshold.
    |
    */
    'minimum_withdrawal' => env('WALLET_MINIMUM_WITHDRAWAL', 10.00),

    /*
    |--------------------------------------------------------------------------
    | Maximum Withdrawal Amount
    |--------------------------------------------------------------------------
    |
    | The maximum amount (in EUR) that can be requested for withdrawal.
    | Set to null for no maximum limit (balance is the only constraint).
    |
    */
    'maximum_withdrawal' => env('WALLET_MAXIMUM_WITHDRAWAL', null),

    /*
    |--------------------------------------------------------------------------
    | Withdrawal Fee Configuration
    |--------------------------------------------------------------------------
    |
    | Configure how withdrawal fees are calculated:
    | - 'type' can be 'percentage', 'fixed', or 'none'
    | - 'value' is the percentage (e.g., 2.5 for 2.5%) or fixed amount in EUR
    |
    */
    'withdrawal_fee' => [
        'type' => env('WALLET_FEE_TYPE', 'none'), // 'percentage', 'fixed', or 'none'
        'value' => env('WALLET_FEE_VALUE', 0),
    ],

    /*
    |--------------------------------------------------------------------------
    | Platform Fee Percentage
    |--------------------------------------------------------------------------
    |
    | The percentage of shipment payments deducted as platform fee
    | before crediting to traveler's wallet (default: 15%).
    |
    */
    'platform_fee_percentage' => env('WALLET_PLATFORM_FEE', 15),

    /*
    |--------------------------------------------------------------------------
    | Cache TTL Settings
    |--------------------------------------------------------------------------
    |
    | Time-to-live (in seconds) for various cached data.
    |
    */
    'cache' => [
        'balance_ttl' => 300,      // 5 minutes
        'history_ttl' => 600,      // 10 minutes
        'pending_ttl' => 300,      // 5 minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    |
    | Configure notification channels for wallet events.
    |
    */
    'notifications' => [
        'channels' => ['mail', 'database', 'broadcast'],
        'admin_channels' => ['mail', 'database'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination Settings
    |--------------------------------------------------------------------------
    |
    | Default pagination limits for various listing endpoints.
    |
    */
    'pagination' => [
        'transactions_per_page' => 50,
        'withdrawals_per_page' => 20,
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Release Settings
    |--------------------------------------------------------------------------
    |
    | Settings for the payment release flow to wallet.
    |
    */
    'payment_release' => [
        'delay_days' => 7,         // Days to wait after delivery confirmation
        'retry_attempts' => 3,     // Number of retry attempts on failure
        'retry_delay' => 300,      // Delay between retries in seconds (5 minutes)
    ],
];
