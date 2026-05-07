<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle soumission KYC</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #f59e0b;">Nouvelle soumission KYC</h2>

        <p>Bonjour {{ $user->name }},</p>

        <p>Un utilisateur a soumis des documents KYC pour verification :</p>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Utilisateur :</strong> {{ $kycData['user_name'] ?? '—' }}</p>
            <p style="margin: 5px 0;"><strong>Email :</strong> {{ $kycData['user_email'] ?? '—' }}</p>
            <p style="margin: 5px 0;"><strong>Type de document :</strong> {{ $kycData['document_type'] ?? '—' }}</p>
            <p style="margin: 5px 0;"><strong>Date :</strong> {{ now()->format('d/m/Y H:i') }}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/admin/kyc"
               style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verifier les documents
            </a>
        </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. Tous droits reserves.</p>
    </div>
</body>
</html>
