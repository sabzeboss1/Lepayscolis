# Stripe Integration Setup

## Overview

This Laravel backend uses the Stripe PHP SDK (v19.3.0) for payment processing, including escrow payments and Stripe Connect for payouts to travelers.

## Installation

The Stripe PHP SDK has been installed via Composer:

```bash
composer require stripe/stripe-php
```

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
STRIPE_KEY=pk_test_your_publishable_key
STRIPE_SECRET=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Configuration Files

Stripe configuration is available in two locations:

1. **config/stripe.php** - Dedicated Stripe configuration
   - API keys
   - Webhook secret
   - Currency (default: EUR)
   - Platform fee percentage (15%)

2. **config/services.php** - Third-party services configuration
   - Contains Stripe credentials for consistency with other services

## Usage

### Basic Initialization

```php
use Stripe\Stripe;

// Set the API key
Stripe::setApiKey(config('stripe.secret'));
```

### Creating a Payment Intent (Escrow)

```php
use Stripe\PaymentIntent;

$paymentIntent = PaymentIntent::create([
    'amount' => $amountInCents,
    'currency' => config('stripe.currency'),
    'metadata' => [
        'shipment_id' => $shipment->id,
        'sender_id' => $sender->id,
        'traveler_id' => $traveler->id,
    ],
]);
```

### Creating a Transfer (Payout to Traveler)

```php
use Stripe\Transfer;

$transfer = Transfer::create([
    'amount' => $travelerAmountInCents,
    'currency' => config('stripe.currency'),
    'destination' => $traveler->stripe_account_id,
    'metadata' => [
        'shipment_id' => $shipment->id,
        'payment_id' => $payment->id,
    ],
]);
```

### Handling Webhooks

```php
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

try {
    $event = Webhook::constructEvent(
        $payload,
        $signature,
        config('stripe.webhook_secret')
    );
    
    // Handle the event
    switch ($event->type) {
        case 'payment_intent.succeeded':
            // Handle successful payment
            break;
        case 'transfer.created':
            // Handle transfer creation
            break;
        // ... other event types
    }
} catch (SignatureVerificationException $e) {
    // Invalid signature
    return response()->json(['error' => 'Invalid signature'], 400);
}
```

## Payment Flow

### 1. Shipment Created
- Status: `pending`
- Payment Status: `pending`

### 2. Shipment Accepted by Traveler
- Status: `accepted`
- Payment Status: `processing`
- Create Stripe PaymentIntent
- Sender completes payment

### 3. Payment Confirmed
- Payment Status: `escrowed`
- Funds held by platform

### 4. Shipment Delivered
- Status: `delivered`
- Queue ReleaseEscrowPayment job (7-day delay)

### 5. Payment Released
- Payment Status: `released`
- Create Stripe Transfer to traveler's account
- Platform retains 15% fee

## Fee Structure

- **Platform Fee**: 15% of payment amount
- **Traveler Amount**: 85% of payment amount

Example:
- Payment Amount: €100
- Platform Fee: €15
- Traveler Receives: €85

## Testing

### Test Mode

Use Stripe test keys for development:
- Publishable Key: `pk_test_...`
- Secret Key: `sk_test_...`

### Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Authentication: `4000 0025 0000 3155`

## Resources

- [Stripe PHP SDK Documentation](https://stripe.com/docs/api?lang=php)
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## Security Notes

1. **Never commit API keys** to version control
2. **Always verify webhook signatures** before processing events
3. **Use HTTPS** in production for webhook endpoints
4. **Store sensitive data encrypted** in the database
5. **Log all payment transactions** for audit purposes

## Next Steps

1. Set up Stripe Connect for traveler accounts
2. Implement PaymentService class
3. Create webhook controller and routes
4. Set up payment event listeners
5. Implement escrow release job
6. Add payment logging and monitoring
