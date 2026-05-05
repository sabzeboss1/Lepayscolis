<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Le Pays Express Colis</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #ef4444;">Verification Rejected</h2>

        <p>Hello {{ $user->name }},</p>

        <p>We have reviewed your identity verification documents and unfortunately cannot approve them for the following reason:</p>

        @if(!empty($reason))
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> {{ $reason }}</p>
        </div>
        @endif

        <p>You may resubmit your documents ensuring they meet the following criteria:</p>
        <ul>
            <li>Valid and legible identity document (national ID, passport, or driver's license)</li>
            <li>Clear photo with no glare or blur</li>
            <li>All information must be clearly visible</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/profile/kyc"
               style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Resubmit my documents
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions, please do not hesitate to contact us.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} Le Pays Express Colis. All rights reserved.</p>
    </div>
</body>
</html>
