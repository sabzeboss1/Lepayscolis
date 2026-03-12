<?php

return [
    'auth' => [
        'register_success' => 'Registration successful.',
        'register_failed' => 'Registration failed.',
        'login_success' => 'Login successful.',
        'login_failed' => 'Login failed.',
        'logout_success' => 'Logout successful.',
    ],

    'profile' => [
        'updated' => 'Profile updated successfully.',
        'avatar_uploaded' => 'Avatar uploaded successfully.',
        'avatar_failed' => 'Failed to upload avatar.',
        'fcm_updated' => 'FCM token updated successfully.',
        'locale_updated' => 'Language updated successfully.',
    ],

    'trip' => [
        'created' => 'Trip created successfully.',
        'updated' => 'Trip updated successfully.',
        'deleted' => 'Trip deleted successfully.',
    ],

    'shipment' => [
        'created' => 'Shipment created successfully.',
        'updated' => 'Shipment updated successfully.',
        'accepted' => 'Shipment accepted successfully.',
        'delivered' => 'Delivery confirmed successfully.',
    ],

    'kyc' => [
        'submitted' => 'KYC documents submitted successfully.',
        'approved' => 'Your identity verification has been approved.',
        'rejected' => 'Your identity verification has been rejected.',
    ],

    'rating' => [
        'submitted' => 'Rating submitted successfully.',
    ],

    'wallet' => [
        'credited' => 'Wallet credited successfully.',
    ],

    'withdrawal' => [
        'created' => 'Withdrawal request created successfully.',
        'cancelled' => 'Withdrawal request cancelled successfully.',
    ],

    'payment' => [
        'refund_success' => 'Refund processed successfully.',
    ],

    'currency' => [
        'not_found' => 'Currency :code not found.',
        'cannot_update_base_rate' => 'Cannot update the exchange rate of the base currency.',
        'cannot_deactivate_base' => 'Cannot deactivate the base currency.',
        'cannot_delete_base' => 'Cannot delete the base currency.',
        'rate_must_be_positive' => 'The exchange rate must be a positive number.',
        'code_format' => 'The currency code must be 3 uppercase letters (ISO 4217).',
        'code_unique' => 'This currency code already exists.',
        'in_use' => 'Cannot delete this currency. It is used by :count records.',
        'created' => 'Currency created successfully.',
        'updated' => 'Currency updated successfully.',
        'rate_updated' => 'Exchange rate updated successfully.',
        'activated' => 'Currency activated successfully.',
        'deactivated' => 'Currency deactivated successfully.',
        'deleted' => 'Currency deleted successfully.',
    ],
];
