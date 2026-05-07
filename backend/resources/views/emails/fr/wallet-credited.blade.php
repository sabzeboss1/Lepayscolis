<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portefeuille crédité</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>
    
    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #10b981;">Votre portefeuille a été crédité !</h2>
        
        <p>Bonjour {{ $user->name }},</p>
        
        <p>Nous avons le plaisir de vous informer que votre portefeuille a été crédité.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 10px 0;"><strong>Montant crédité :</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">{{ number_format($amount, 2) }} €</span></p>
            <p style="margin: 0;"><strong>Nouveau solde :</strong> <span style="font-size: 20px; font-weight: bold;">{{ number_format($new_balance, 2) }} €</span></p>
            @if($description)
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;"><strong>Description :</strong> {{ $description }}</p>
            @endif
        </div>
        
        <p>Vous pouvez maintenant :</p>
        <ul>
            <li>Consulter l'historique de vos transactions</li>
            <li>Demander un retrait de vos fonds</li>
            <li>Continuer à accumuler vos gains</li>
        </ul>
        
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
