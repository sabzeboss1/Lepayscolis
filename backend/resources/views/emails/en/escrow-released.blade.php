<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Funds Returned</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #10b981;">Your funds have been returned</h2>

        <p>Hello {{ $user->name }},</p>

        <p>Following the cancellation of your shipment, the funds that were held in escrow have been returned to your wallet.</p>

        <div style="background-color: white; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount returned:</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">{{ number_format($amount, 2) }} {{ $currency }}</span></p>
            <p style="margin: 5px 0;"><strong>Shipment:</strong> #{{ $shipment->id }}</p>
            <p style="margin: 5px 0;"><strong>Title:</strong> {{ $shipment->title ?? '—' }}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{ now()->format('m/d/Y g:i A') }}</p>
        </div>

        <p>Your available balance has been updated. You can check your wallet to confirm the credit.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/wallet"
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View my wallet
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Thank you for trusting {{ $platformName }} with your shipments.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. All rights reserved.</p>
    </div>
</body>
</html>
