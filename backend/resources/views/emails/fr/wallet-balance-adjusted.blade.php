<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ajustement de solde</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: {{ $is_positive ? '#10b981' : '#f59e0b' }}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>
    
    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: {{ $is_positive ? '#10b981' : '#f59e0b' }};">Ajustement de votre solde de portefeuille</h2>
        
        <p>Bonjour {{ $user->name }},</p>
        
        <p>Nous vous informons qu'un ajustement a été effectué sur votre portefeuille par notre équipe administrative.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid {{ $is_positive ? '#10b981' : '#f59e0b' }};">
            <p style="margin: 0 0 10px 0;">
                <strong>Type d'ajustement :</strong> 
                <span style="color: {{ $is_positive ? '#10b981' : '#f59e0b' }}; font-weight: bold;">
                    {{ $is_positive ? '➕ Crédit' : '➖ Débit' }}
                </span>
            </p>
            <p style="margin: 0 0 10px 0;">
                <strong>Montant :</strong> 
                <span style="color: {{ $is_positive ? '#10b981' : '#f59e0b' }}; font-size: 24px; font-weight: bold;">
                    {{ $is_positive ? '+' : '-' }}{{ number_format($amount, 2) }} {{ $currency }}
                </span>
            </p>
            <p style="margin: 0;">
                <strong>Nouveau solde :</strong> 
                <span style="font-size: 20px; font-weight: bold;">{{ number_format($new_balance, 2) }} {{ $currency }}</span>
            </p>
        </div>
        
        <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6366f1;">
            <p style="margin: 0 0 5px 0; color: #3730a3; font-weight: bold;">Raison de l'ajustement :</p>
            <p style="margin: 0; color: #3730a3;">{{ $reason }}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
            <strong>Effectué par :</strong> {{ $admin_name }} (Administrateur)
        </p>
        
        @if($is_positive)
        <p>Ce montant a été ajouté à votre portefeuille et est maintenant disponible pour vos transactions ou retraits.</p>
        @else
        <p>Ce montant a été déduit de votre portefeuille. Si vous avez des questions concernant cet ajustement, n'hésitez pas à contacter notre service client.</p>
        @endif
        
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
