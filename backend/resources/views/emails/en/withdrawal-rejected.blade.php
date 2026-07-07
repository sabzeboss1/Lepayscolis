<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdrawal Request Rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #ef4444;">Your withdrawal request has been rejected</h2>

        <p>Hello {{ $user->name }},</p>

        <p>We regret to inform you that your withdrawal request could not be approved.</p>

        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 10px 0;"><strong>Requested amount:</strong> <span style="font-size: 24px; font-weight: bold;">{{ number_format($amount, 2) }} {{ $currency }}</span></p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Reference:</strong> #{{ $withdrawal_id }}</p>
        </div>

        <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 5px 0; color: #991b1b; font-weight: bold;">Reason for rejection:</p>
            <p style="margin: 0; color: #991b1b;">{{ $reason }}</p>
        </div>

        <p>Your balance remains unchanged and you can submit a new withdrawal request if you wish.</p>

        <p>If you have any questions about this rejection, please do not hesitate to contact our support team.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/wallet"
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View my wallet
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Thank you for trusting {{ $platformName }} for your international shipments.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. All rights reserved.</p>
    </div>
</body>
</html>
