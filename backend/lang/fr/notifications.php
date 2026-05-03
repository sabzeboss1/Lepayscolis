<?php

return [
    'new_message' => 'Nouveau message',
    'shipment_created' => 'Nouvelle demande d\'expédition',
    'shipment_accepted' => 'Colis accepté',
    'shipment_in_transit' => 'Colis en transit',
    'shipment_delivered' => 'Colis livré',
    'kyc_approved' => 'Vérification approuvée',
    'kyc_rejected' => 'Vérification rejetée',
    'rating_received' => 'Nouvelle évaluation',
    'payment_released' => 'Paiement libéré',
    'payment_refunded' => 'Paiement remboursé',
    'wallet_credited' => [
        'title' => 'Portefeuille crédité',
        'body' => 'Votre portefeuille a été crédité de :amount €. Nouveau solde : :balance €',
    ],

    'trip_verified' => [
        'title' => 'Voyage approuvé',
        'body' => 'Votre voyage de :departure à :arrival a été approuvé et est maintenant visible par les expéditeurs.',
    ],
    'trip_rejected' => [
        'title' => 'Voyage rejeté',
        'body' => 'Votre voyage de :departure à :arrival a été rejeté. Motif : :reason',
    ],
    'trip_cancelled' => [
        'title' => 'Voyage annulé',
        'body' => 'Votre voyage de :departure à :arrival a été annulé. Motif : :reason',
    ],
    'shipment_cancelled' => [
        'title' => 'Expédition annulée',
        'body' => 'Votre expédition a été annulée. Motif : :reason',
    ],
    'kyc_approved_body' => 'Votre vérification d\'identité a été approuvée. Vous pouvez maintenant créer des voyages et des expéditions.',
    'kyc_rejected_body' => 'Votre vérification d\'identité a été rejetée. Motif : :reason',

    // Admin notifications
    'admin_new_user' => [
        'title' => 'Nouvel utilisateur inscrit',
        'body' => ':name (:email) vient de créer un compte.',
    ],
    'admin_kyc_submitted' => [
        'title' => 'Nouvelle soumission KYC',
        'body' => ':name a soumis un document KYC (:document_type) pour vérification.',
    ],
];
