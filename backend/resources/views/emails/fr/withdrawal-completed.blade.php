<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Retrait complété</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>
    
    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #10b981;">Votre retrait a été complété ! ✅</h2>
        
        <p>Bonjour {{ $user->name }},</p>
        
        <p>Nous avons le plaisir de vous informer que votre retrait a été complété avec succès. Les fonds ont été débités de votre portefeuille.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 10px 0;"><strong>Montant retiré :</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">{{ number_format($amount, 2) }} {{ $currency }}</span></p>
            <p style="margin: 0 0 10px 0;"><strong>Frais de retrait :</strong> <span style="font-size: 18px;">{{ number_format($fee, 2) }} {{ $currency }}</span></p>
            <p style="margin: 0 0 10px 0;"><strong>Montant net reçu :</strong> <span style="font-size: 20px; font-weight: bold; color: #10b981;">{{ number_format($net_amount, 2) }} {{ $currency }}</span></p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Référence :</strong> #{{ $withdrawal_id }}</p>
        </div>
        
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>💰 Récupération des fonds :</strong> Vous pouvez maintenant récupérer vos fonds auprès de notre agence ou du point de retrait convenu.
            </p>
        </div>
        
        <p>Votre nouveau solde de portefeuille a été mis à jour. Vous pouvez consulter l'historique complet de vos transactions à tout moment.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/wallet/transactions" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir mes transactions
            </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Merci de faire confiance à {{ $platformName }} pour vos envois internationaux.
        </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. Tous droits réservés.</p>
    </div>
</body>
</html>
