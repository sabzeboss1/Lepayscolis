<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande de retrait refusée</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>
    
    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #ef4444;">Votre demande de retrait a été refusée</h2>
        
        <p>Bonjour {{ $user->name }},</p>
        
        <p>Nous regrettons de vous informer que votre demande de retrait n'a pas pu être approuvée.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 10px 0;"><strong>Montant demandé :</strong> <span style="font-size: 24px; font-weight: bold;">{{ number_format($amount, 2) }} {{ $currency }}</span></p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Référence :</strong> #{{ $withdrawal_id }}</p>
        </div>
        
        <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 5px 0; color: #991b1b; font-weight: bold;">Raison du refus :</p>
            <p style="margin: 0; color: #991b1b;">{{ $reason }}</p>
        </div>
        
        <p>Votre solde reste inchangé et vous pouvez soumettre une nouvelle demande de retrait si vous le souhaitez.</p>
        
        <p>Si vous avez des questions concernant ce refus, n'hésitez pas à contacter notre service client.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/wallet" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir mon portefeuille
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
