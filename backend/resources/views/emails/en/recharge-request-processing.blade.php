<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Request being processed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #8b5cf6;">Your request is being processed</h2>

        <p>Hello {{ $user->name }},</p>

        <p>Great news! A member of our team has taken charge of your recharge request and is currently processing it.</p>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> <span style="font-size: 20px; font-weight: bold;">{{ number_format($rechargeRequest->amount, 2) }} {{ $rechargeRequest->currency_code }}</span></p>
            <p style="margin: 5px 0;"><strong>Payment method:</strong> {{ $rechargeRequest->payment_method }}</p>
            <p style="margin: 5px 0;"><strong>Reference:</strong> #{{ $rechargeRequest->id }}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #8b5cf6; font-weight: bold;">Processing</span></p>
        </div>

        <p>Your wallet will be credited very shortly. You will receive a confirmation email.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/wallet"
               style="background-color: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View my wallet
            </a>
        </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. All rights reserved.</p>
    </div>
</body>
</html>
