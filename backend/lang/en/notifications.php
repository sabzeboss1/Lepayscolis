<?php

return [
    'new_message' => 'New message',
    'shipment_created' => 'New shipment request',
    'shipment_accepted' => 'Package accepted',
    'shipment_in_transit' => 'Package in transit',
    'shipment_delivered' => 'Package delivered',
    'kyc_approved' => 'Verification approved',
    'kyc_rejected' => 'Verification rejected',
    'rating_received' => 'New rating',
    'payment_released' => 'Payment released',
    'payment_refunded' => 'Payment refunded',
    'wallet_credited' => [
        'title' => 'Wallet Credited',
        'body' => 'Your wallet has been credited with :amount :currency. New balance: :balance :currency',
    ],

    'trip_verified' => [
        'title' => 'Trip approved',
        'body' => 'Your trip from :departure to :arrival has been approved and is now visible to senders.',
    ],
    'trip_rejected' => [
        'title' => 'Trip rejected',
        'body' => 'Your trip from :departure to :arrival has been rejected. Reason: :reason',
    ],
    'trip_cancelled' => [
        'title' => 'Trip cancelled',
        'body' => 'Your trip from :departure to :arrival has been cancelled. Reason: :reason',
    ],
    'shipment_cancelled' => [
        'title' => 'Shipment cancelled',
        'body' => 'Your shipment has been cancelled. Reason: :reason',
    ],
    'kyc_approved_body' => 'Your identity verification has been approved. You can now create trips and shipments.',
    'kyc_rejected_body' => 'Your identity verification has been rejected. Reason: :reason',

    // Admin notifications
    'admin_new_user' => [
        'title' => 'New user registered',
        'body' => ':name (:email) just created an account.',
    ],
    'admin_kyc_submitted' => [
        'title' => 'New KYC submission',
        'body' => ':name submitted a KYC document (:document_type) for verification.',
    ],
];
