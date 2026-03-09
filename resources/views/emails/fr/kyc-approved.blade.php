<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification approuvée</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Le Pays Express Colis</h1>
    </div>
    
    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #10b981;">Félicitations {{ $user->name }} !</h2>
        
        <p>Votre vérification d'identité a été approuvée avec succès.</p>
        
        <p>Vous pouvez maintenant :</p>
        <ul>
            <li>Publier des annonces de voyage</li>
            <li>Créer des demandes d'expédition</li>
            <li>Accéder à toutes les fonctionnalités de la plateforme</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/dashboard" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accéder à mon tableau de bord
            </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Merci de faire confiance à Le Pays Express Colis pour vos envois internationaux.
        </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} Le Pays Express Colis. Tous droits réservés.</p>
    </div>
</body>
</html>
