<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trip completed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">{{ $platformName }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #3b82f6;">Your trip has been completed</h2>

        <p>Hello {{ $user->name }},</p>

        <p>Your trip has been automatically marked as completed because the arrival date has passed.</p>

        <div style="background-color: white; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Route:</strong> {{ $trip->departure_city }} → {{ $trip->arrival_city }}</p>
            <p style="margin: 5px 0;"><strong>Departure date:</strong> {{ $trip->departure_date?->format('d/m/Y') }}</p>
            <p style="margin: 5px 0;"><strong>Arrival date:</strong> {{ $trip->arrival_date?->format('d/m/Y') }}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/trips"
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View my trips
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Thank you for traveling with {{ $platformName }}.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; {{ date('Y') }} {{ $platformName }}. All rights reserved.</p>
    </div>
</body>
</html>
