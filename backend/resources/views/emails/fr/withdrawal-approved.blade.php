<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande de retrait approuvée</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>
    
    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #10b981;">Votre demande de retrait a été approuvée !</h2>
        
        <p>Bonjour {{ $user->name }},</p>
        
        <p>Nous avons le plaisir de vous informer que votre demande de retrait a été approuvée par notre équipe.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 10px 0;"><strong>Montant demandé :</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">{{ number_format($amount, 2) }} {{ $currency }}</span></p>
            <p style="margin: 0 0 10px 0;"><strong>Frais de retrait :</strong> <span style="font-size: 18px;">{{ number_format($fee, 2) }} {{ $currency }}</span></p>
            <p style="margin: 0;"><strong>Montant net à recevoir :</strong> <span style="font-size: 20px; font-weight: bold;">{{ number_format($net_amount, 2) }} {{ $currency }}</span></p>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;"><strong>Référence :</strong> #{{ $withdrawal_id }}</p>
        </div>
        
        <p>Votre retrait est maintenant en cours de traitement. Vous recevrez une nouvelle notification lorsque les fonds seront disponibles.</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⏱️ Délai de traitement :</strong> Les retraits sont généralement traités sous 2 à 5 jours ouvrables.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/withdrawals" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir mes retraits
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
