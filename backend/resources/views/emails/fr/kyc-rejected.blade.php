<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification rejetée</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #ef4444;">Vérification rejetée</h2>

        <p>Bonjour {{ $user->name }},</p>

        <p>Nous avons examiné vos documents de vérification d'identité et nous ne pouvons malheureusement pas les approuver pour la raison suivante :</p>

        @if(!empty($reason))
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Motif :</strong> {{ $reason }}</p>
        </div>
        @endif

        <p>Vous pouvez soumettre à nouveau vos documents en vous assurant qu'ils respectent les critères suivants :</p>
        <ul>
            <li>Document d'identité valide et lisible (carte nationale, passeport ou permis de conduire)</li>
            <li>Photo nette et sans reflet</li>
            <li>Toutes les informations doivent être clairement visibles</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/profile/kyc"
               style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Soumettre à nouveau mes documents
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si vous avez des questions, n'hésitez pas à nous contacter.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. Tous droits réservés.</p>
    </div>
</body>
</html>
