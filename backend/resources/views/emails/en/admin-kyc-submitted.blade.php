<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New KYC Submission</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Le Pays Express Colis</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #f59e0b;">New KYC Submission</h2>

        <p>Hello {{ $user->name }},</p>

        <p>A user has submitted KYC documents for verification:</p>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>User:</strong> {{ $kycData['user_name'] ?? '—' }}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> {{ $kycData['user_email'] ?? '—' }}</p>
            <p style="margin: 5px 0;"><strong>Document type:</strong> {{ $kycData['document_type'] ?? '—' }}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{ now()->format('Y-m-d H:i') }}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/admin/kyc"
               style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review Documents
            </a>
        </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} Le Pays Express Colis. All rights reserved.</p>
    </div>
</body>
</html>
