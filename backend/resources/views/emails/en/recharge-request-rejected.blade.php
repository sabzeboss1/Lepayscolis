<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recharge request rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #ef4444;">Recharge request rejected</h2>

        <p>Hello {{ $user->name }},</p>

        <p>We regret to inform you that your wallet recharge request has been rejected.</p>

        <div style="background-color: white; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount requested:</strong> {{ number_format($rechargeRequest->amount, 2) }} {{ $rechargeRequest->currency_code }}</p>
            <p style="margin: 5px 0;"><strong>Payment method:</strong> {{ $rechargeRequest->payment_method }}</p>
            <p style="margin: 5px 0;"><strong>Reference:</strong> #{{ $rechargeRequest->id }}</p>
            <p style="margin: 5px 0;"><strong>Processed on:</strong> {{ $rechargeRequest->processed_at?->format('m/d/Y at H:i') }}</p>
            @if($rechargeRequest->admin_notes)
            <p style="margin: 10px 0 0 0;"><strong>Reason:</strong> <span style="color: #ef4444;">{{ $rechargeRequest->admin_notes }}</span></p>
            @endif
        </div>

        <p>If you believe this decision is an error or have any questions, please contact us or submit a new request.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/wallet"
               style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View my wallet
            </a>
        </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. All rights reserved.</p>
    </div>
</body>
</html>
