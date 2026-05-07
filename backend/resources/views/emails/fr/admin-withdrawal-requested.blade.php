<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle demande de retrait</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>
    
    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #3b82f6;">🔔 Nouvelle demande de retrait</h2>
        
        <p>Bonjour {{ $admin->name }},</p>
        
        <p>Une nouvelle demande de retrait nécessite votre attention et votre approbation.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 15px 0; color: #3b82f6;">Détails de la demande</h3>
            
            <p style="margin: 5px 0;"><strong>Référence :</strong> #{{ $withdrawal_id }}</p>
            <p style="margin: 5px 0;"><strong>Date :</strong> {{ $created_at->format('d/m/Y à H:i') }}</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
            
            <h4 style="margin: 15px 0 10px 0; color: #6b7280;">Utilisateur</h4>
            <p style="margin: 5px 0;"><strong>Nom :</strong> {{ $user_name }}</p>
            <p style="margin: 5px 0;"><strong>Email :</strong> {{ $user_email }}</p>
            <p style="margin: 5px 0;"><strong>ID :</strong> #{{ $user_id }}</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
            
            <h4 style="margin: 15px 0 10px 0; color: #6b7280;">Montants</h4>
            <p style="margin: 5px 0;"><strong>Montant demandé :</strong> <span style="color: #3b82f6; font-size: 20px; font-weight: bold;">{{ number_format($amount, 2) }} €</span></p>
            <p style="margin: 5px 0;"><strong>Frais de retrait :</strong> {{ number_format($fee, 2) }} €</p>
            <p style="margin: 5px 0;"><strong>Montant net :</strong> <span style="font-weight: bold;">{{ number_format($net_amount, 2) }} €</span></p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Action requise :</strong> Cette demande nécessite votre approbation avant traitement. Veuillez vérifier les informations et approuver ou rejeter la demande.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.admin_url') }}/withdrawals/{{ $withdrawal_id }}" 
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
                Examiner la demande
            </a>
            <a href="{{ config('app.admin_url') }}/withdrawals" 
               style="background-color: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir toutes les demandes
            </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Cet email a été envoyé automatiquement. Veuillez ne pas y répondre.
        </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. Tous droits réservés.</p>
    </div>
</body>
</html>
