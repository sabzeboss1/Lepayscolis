<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande de recharge reçue</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #2563eb;">Demande de recharge reçue</h2>

        <p>Bonjour {{ $user->name }},</p>

        <p>Nous avons bien reçu votre demande de recharge de portefeuille. Notre équipe va la traiter dans les plus brefs délais.</p>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Montant demandé :</strong> <span style="color: #2563eb; font-size: 20px; font-weight: bold;">{{ number_format($rechargeRequest->amount, 2) }} {{ $rechargeRequest->currency_code }}</span></p>
            <p style="margin: 5px 0;"><strong>Méthode de paiement :</strong> {{ $rechargeRequest->payment_method }}</p>
            <p style="margin: 5px 0;"><strong>Référence :</strong> #{{ $rechargeRequest->id }}</p>
            <p style="margin: 5px 0;"><strong>Date :</strong> {{ $rechargeRequest->created_at->format('d/m/Y à H:i') }}</p>
            <p style="margin: 5px 0;"><strong>Statut :</strong> <span style="color: #f59e0b; font-weight: bold;">En attente</span></p>
        </div>

        <p>Vous serez notifié par email dès que votre demande sera traitée.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/wallet"
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir mon portefeuille
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Merci de faire confiance à {{ $platformName }}.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. Tous droits réservés.</p>
    </div>
</body>
</html>
