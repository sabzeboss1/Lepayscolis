<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sauvegarde terminee</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #10b981;">Sauvegarde terminee avec succes</h2>

        <p>Bonjour,</p>

        <p>Une sauvegarde {{ $backup->type->value === 'scheduled' ? 'planifiee' : 'manuelle' }} a ete completee avec succes.</p>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Fichier :</strong> {{ $backup->file_name }}</p>
            <p style="margin: 5px 0;"><strong>Taille :</strong> {{ $backup->formatted_file_size }}</p>
            <p style="margin: 5px 0;"><strong>Type :</strong> {{ $backup->type->value === 'scheduled' ? 'Planifiee' : 'Manuelle' }}</p>
            <p style="margin: 5px 0;"><strong>Declenchee par :</strong> {{ $backup->triggeredBy?->name ?? 'Systeme' }}</p>
            <p style="margin: 5px 0;"><strong>Terminee le :</strong> {{ $backup->completed_at?->format('d/m/Y a H:i') }}</p>
            @if($backup->google_drive_file_id)
                <p style="margin: 5px 0;"><strong>Google Drive :</strong> <span style="color: #10b981;">Uploade</span></p>
            @else
                <p style="margin: 5px 0;"><strong>Google Drive :</strong> <span style="color: #f59e0b;">Conservee localement</span></p>
            @endif
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/admin/backups"
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir les sauvegardes
            </a>
        </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. Tous droits reserves.</p>
    </div>
</body>
</html>
