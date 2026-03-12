<?php

return [
    'auth' => [
        'register_success' => 'Inscription réussie.',
        'register_failed' => 'L\'inscription a échoué.',
        'login_success' => 'Connexion réussie.',
        'login_failed' => 'La connexion a échoué.',
        'logout_success' => 'Déconnexion réussie.',
    ],

    'profile' => [
        'updated' => 'Profil mis à jour avec succès.',
        'avatar_uploaded' => 'Avatar téléchargé avec succès.',
        'avatar_failed' => 'Échec du téléchargement de l\'avatar.',
        'fcm_updated' => 'Jeton FCM mis à jour avec succès.',
        'locale_updated' => 'Langue mise à jour avec succès.',
    ],

    'trip' => [
        'created' => 'Voyage créé avec succès.',
        'updated' => 'Voyage mis à jour avec succès.',
        'deleted' => 'Voyage supprimé avec succès.',
    ],

    'shipment' => [
        'created' => 'Expédition créée avec succès.',
        'updated' => 'Expédition mise à jour avec succès.',
        'accepted' => 'Expédition acceptée avec succès.',
        'delivered' => 'Livraison confirmée avec succès.',
    ],

    'kyc' => [
        'submitted' => 'Documents KYC soumis avec succès.',
        'approved' => 'Votre vérification d\'identité a été approuvée.',
        'rejected' => 'Votre vérification d\'identité a été rejetée.',
    ],

    'rating' => [
        'submitted' => 'Évaluation soumise avec succès.',
    ],

    'wallet' => [
        'credited' => 'Portefeuille crédité avec succès.',
    ],

    'withdrawal' => [
        'created' => 'Demande de retrait créée avec succès.',
        'cancelled' => 'Demande de retrait annulée avec succès.',
    ],

    'payment' => [
        'refund_success' => 'Remboursement effectué avec succès.',
    ],

    'country' => [
        'created' => 'Pays créé avec succès.',
        'updated' => 'Pays mis à jour avec succès.',
        'activated' => 'Pays activé avec succès.',
        'deactivated' => 'Pays désactivé avec succès.',
        'deleted' => 'Pays supprimé avec succès.',
        'in_use' => 'Impossible de supprimer ce pays. Il est utilisé par :count enregistrements.',
        'not_found' => 'Pays introuvable.',
    ],

    'city' => [
        'created' => 'Ville créée avec succès.',
        'updated' => 'Ville mise à jour avec succès.',
        'activated' => 'Ville activée avec succès.',
        'deactivated' => 'Ville désactivée avec succès.',
        'deleted' => 'Ville supprimée avec succès.',
        'in_use' => 'Impossible de supprimer cette ville. Elle est utilisée par :count enregistrements.',
        'not_found' => 'Ville introuvable.',
    ],

    'currency' => [
        'not_found' => 'Devise :code introuvable.',
        'cannot_update_base_rate' => 'Impossible de modifier le taux de change de la devise de base.',
        'cannot_deactivate_base' => 'Impossible de désactiver la devise de base.',
        'cannot_delete_base' => 'Impossible de supprimer la devise de base.',
        'rate_must_be_positive' => 'Le taux de change doit être un nombre positif.',
        'code_format' => 'Le code devise doit être composé de 3 lettres majuscules (ISO 4217).',
        'code_unique' => 'Ce code devise existe déjà.',
        'in_use' => 'Impossible de supprimer cette devise. Elle est utilisée par :count enregistrements.',
        'created' => 'Devise créée avec succès.',
        'updated' => 'Devise mise à jour avec succès.',
        'rate_updated' => 'Taux de change mis à jour avec succès.',
        'activated' => 'Devise activée avec succès.',
        'deactivated' => 'Devise désactivée avec succès.',
        'deleted' => 'Devise supprimée avec succès.',
    ],
];
