<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Stripe API Keys
    |--------------------------------------------------------------------------
    |
    | The Stripe publishable and secret keys from your Stripe account.
    | You can find these in your Stripe Dashboard.
    |
    */

    'key' => env('STRIPE_KEY'),

    'secret' => env('STRIPE_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Stripe Webhook Secret
    |--------------------------------------------------------------------------
    |
    | The webhook secret is used to verify that webhook events are sent by
    | Stripe and not by a third party. You can find this in your Stripe
    | Dashboard under Developers > Webhooks.
    |
    */

    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Stripe API Version
    |--------------------------------------------------------------------------
    |
    | The Stripe API version to use. This should match the version you're
    | developing against. Leave null to use the account's default version.
    |
    */

    'api_version' => null,

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    |
    | The default currency for payments. This should be a three-letter
    | ISO currency code (e.g., 'eur', 'usd').
    |
    */

    'currency' => 'eur',

    /*
    |--------------------------------------------------------------------------
    | Platform Fee Percentage
    |--------------------------------------------------------------------------
    |
    | The percentage of each transaction that the platform takes as a fee.
    | Default is 15% as per requirements.
    |
    */

    'platform_fee_percentage' => 15,

];
