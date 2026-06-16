<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New recharge request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #f59e0b;">New recharge request pending</h2>

        <p>Hello {{ $admin->name }},</p>

        <p>A user has just submitted a wallet recharge request. It is waiting to be processed.</p>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>User:</strong> {{ $rechargeRequest->user->name }}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> {{ $rechargeRequest->user->email }}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> <span style="color: #f59e0b; font-size: 20px; font-weight: bold;">{{ number_format($rechargeRequest->amount, 2) }} {{ $rechargeRequest->currency_code }}</span></p>
            <p style="margin: 5px 0;"><strong>Payment method:</strong> {{ $rechargeRequest->payment_method }}</p>
            <p style="margin: 5px 0;"><strong>Reference:</strong> #{{ $rechargeRequest->id }}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{ $rechargeRequest->created_at->format('m/d/Y at H:i') }}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/admin/recharge-requests/{{ $rechargeRequest->id }}"
               style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Process this request
            </a>
        </div>

        <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
            This email was sent to all available administrators. The first one to take charge of this request will be designated as the processing administrator.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. All rights reserved.</p>
    </div>
</body>
</html>
