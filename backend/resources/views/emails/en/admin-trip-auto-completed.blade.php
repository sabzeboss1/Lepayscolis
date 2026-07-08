<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trips auto-completed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #6366f1;">[Admin] Trips auto-completed</h2>

        <p>Hello {{ $user->name }},</p>

        <p>The system has automatically processed trips whose arrival date has passed.</p>

        <div style="background-color: white; border-left: 4px solid #6366f1; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Trips completed:</strong> {{ $tripsCount }}</p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Associated shipments remain intact and can still be delivered.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/admin/trips"
               style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View trips
            </a>
        </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. All rights reserved.</p>
    </div>
</body>
</html>
