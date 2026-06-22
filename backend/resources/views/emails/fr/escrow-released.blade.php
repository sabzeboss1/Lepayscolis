<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fonds restitués</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #10b981;">Vos fonds ont été restitués</h2>

        <p>Bonjour {{ $user->name }},</p>

        <p>Suite à l'annulation de votre expédition, les fonds qui étaient bloqués en attente de traitement vous ont été restitués sur votre portefeuille.</p>

        <div style="background-color: white; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Montant restitué :</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">{{ number_format($amount, 2) }} {{ $currency }}</span></p>
            <p style="margin: 5px 0;"><strong>Expédition :</strong> #{{ $shipment->id }}</p>
            <p style="margin: 5px 0;"><strong>Titre :</strong> {{ $shipment->title ?? '—' }}</p>
            <p style="margin: 5px 0;"><strong>Date de restitution :</strong> {{ now()->format('d/m/Y à H:i') }}</p>
        </div>

        <p>Votre solde disponible a été mis à jour. Vous pouvez consulter votre portefeuille pour vérifier le crédit.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/wallet"
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir mon portefeuille
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Merci de faire confiance à {{ $platformName }} pour vos envois.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. Tous droits réservés.</p>
    </div>
</body>
</html>
