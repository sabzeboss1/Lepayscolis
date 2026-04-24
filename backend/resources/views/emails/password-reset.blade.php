<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Le Pays Express Colis</h1>
    </div>
    
    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #2563eb;">Réinitialisation de votre mot de passe</h2>
        
        <p>Bonjour {{ $userName }},</p>
        
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $resetUrl }}" 
               style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Réinitialiser mon mot de passe
            </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
            Ce lien est valable pendant 60 minutes. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
        </p>
        <p style="color: #2563eb; font-size: 12px; word-break: break-all;">
            {{ $resetUrl }}
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Cordialement,<br>
            L'équipe Le Pays Express Colis
        </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} Le Pays Express Colis. Tous droits réservés.</p>
        <p style="margin-top: 10px;">
            Pour des raisons de sécurité, ne partagez jamais ce lien avec qui que ce soit.
        </p>
    </div>
</body>
</html>
