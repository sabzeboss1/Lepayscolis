<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recharge completed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #10b981;">Wallet recharge completed</h2>

        <p>Hello {{ $admin->name }},</p>

        <p>The following recharge request has been approved and the user's wallet has been credited.</p>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>User:</strong> {{ $rechargeRequest->user->name }}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> {{ $rechargeRequest->user->email }}</p>
            <p style="margin: 5px 0;"><strong>Amount credited:</strong> <span style="color: #10b981; font-size: 20px; font-weight: bold;">{{ number_format($rechargeRequest->amount, 2) }} {{ $rechargeRequest->currency_code }}</span></p>
            <p style="margin: 5px 0;"><strong>Payment method:</strong> {{ $rechargeRequest->payment_method }}</p>
            <p style="margin: 5px 0;"><strong>Reference:</strong> #{{ $rechargeRequest->id }}</p>
            <p style="margin: 5px 0;"><strong>Processed by:</strong> {{ $rechargeRequest->processedBy->name ?? '—' }}</p>
            <p style="margin: 5px 0;"><strong>Processed on:</strong> {{ $rechargeRequest->processed_at?->format('m/d/Y at H:i') }}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/admin/recharge-requests"
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View all requests
            </a>
        </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. All rights reserved.</p>
    </div>
</body>
</html>
