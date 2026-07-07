<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Balance Adjustment</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: {{ $is_positive ? '#10b981' : '#f59e0b' }}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: {{ $is_positive ? '#10b981' : '#f59e0b' }};">Your wallet balance has been adjusted</h2>

        <p>Hello {{ $user->name }},</p>

        <p>We would like to inform you that an adjustment has been made to your wallet by our administrative team.</p>

        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid {{ $is_positive ? '#10b981' : '#f59e0b' }};">
            <p style="margin: 0 0 10px 0;">
                <strong>Adjustment type:</strong>
                <span style="color: {{ $is_positive ? '#10b981' : '#f59e0b' }}; font-weight: bold;">
                    {{ $is_positive ? '➕ Credit' : '➖ Debit' }}
                </span>
            </p>
            <p style="margin: 0 0 10px 0;">
                <strong>Amount:</strong>
                <span style="color: {{ $is_positive ? '#10b981' : '#f59e0b' }}; font-size: 24px; font-weight: bold;">
                    {{ $is_positive ? '+' : '-' }}{{ number_format($amount, 2) }} {{ $currency }}
                </span>
            </p>
            <p style="margin: 0;">
                <strong>New balance:</strong>
                <span style="font-size: 20px; font-weight: bold;">{{ number_format($new_balance, 2) }} {{ $currency }}</span>
            </p>
        </div>

        <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6366f1;">
            <p style="margin: 0 0 5px 0; color: #3730a3; font-weight: bold;">Reason for adjustment:</p>
            <p style="margin: 0; color: #3730a3;">{{ $reason }}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
            <strong>Performed by:</strong> {{ $admin_name }} (Administrator)
        </p>

        @if($is_positive)
        <p>This amount has been added to your wallet and is now available for your transactions or withdrawals.</p>
        @else
        <p>This amount has been deducted from your wallet. If you have any questions about this adjustment, please do not hesitate to contact our support team.</p>
        @endif

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/wallet/transactions"
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View my transactions
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
