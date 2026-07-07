<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Withdrawal Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #3b82f6;">New Withdrawal Request</h2>

        <p>Hello {{ $admin->name }},</p>

        <p>A new withdrawal request requires your attention and approval.</p>

        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 15px 0; color: #3b82f6;">Request Details</h3>

            <p style="margin: 5px 0;"><strong>Reference:</strong> #{{ $withdrawal_id }}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{ $created_at->format('m/d/Y \a\t H:i') }}</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">

            <h4 style="margin: 15px 0 10px 0; color: #6b7280;">User</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> {{ $user_name }}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> {{ $user_email }}</p>
            <p style="margin: 5px 0;"><strong>ID:</strong> #{{ $user_id }}</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">

            <h4 style="margin: 15px 0 10px 0; color: #6b7280;">Amounts</h4>
            <p style="margin: 5px 0;"><strong>Requested amount:</strong> <span style="color: #3b82f6; font-size: 20px; font-weight: bold;">{{ number_format($amount, 2) }} {{ $currency }}</span></p>
            <p style="margin: 5px 0;"><strong>Withdrawal fee:</strong> {{ number_format($fee, 2) }} {{ $currency }}</p>
            <p style="margin: 5px 0;"><strong>Net amount:</strong> <span style="font-weight: bold;">{{ number_format($net_amount, 2) }} {{ $currency }}</span></p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Action required:</strong> This request needs your approval before processing. Please review the information and approve or reject the request.
            </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.admin_url') }}/withdrawals/{{ $withdrawal_id }}"
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
                Review request
            </a>
            <a href="{{ config('app.admin_url') }}/withdrawals"
               style="background-color: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View all requests
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This email was sent automatically. Please do not reply.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. All rights reserved.</p>
    </div>
</body>
</html>
