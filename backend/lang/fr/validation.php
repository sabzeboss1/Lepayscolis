<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Authentification
    |--------------------------------------------------------------------------
    */
    'auth' => [
        'email_required' => 'L\'adresse email est obligatoire.',
        'email_email' => 'Veuillez fournir une adresse email valide.',
        'email_unique' => 'Cette adresse email est déjà utilisée.',
        'password_required' => 'Le mot de passe est obligatoire.',
        'password_min' => 'Le mot de passe doit contenir au moins 8 caractères.',
        'name_required' => 'Le nom est obligatoire.',
        'phone_required' => 'Le numéro de téléphone est obligatoire.',
        'phone_unique' => 'Ce numéro de téléphone est déjà utilisé.',
        'phone_regex' => 'Le numéro de téléphone doit être au format international (ex: +33612345678).',
        'locale_required' => 'La langue est obligatoire.',
        'locale_in' => 'La langue doit être fr ou en.',
        'invalid_credentials' => 'Les identifiants fournis sont incorrects.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Voyages
    |--------------------------------------------------------------------------
    */
    'trip' => [
        'departure_date_after' => 'La date de départ doit être postérieure à aujourd\'hui.',
        'arrival_date_after' => 'La date d\'arrivée doit être postérieure à la date de départ.',
        'capacity_min' => 'La capacité disponible doit être d\'au moins 0,1 kg.',
        'capacity_max' => 'La capacité disponible ne doit pas dépasser 100 kg.',
        'price_min' => 'Le prix par kg doit être d\'au moins 1.',
        'price_max' => 'Le prix par kg ne doit pas dépasser 1000.',
        'package_types_required' => 'Veuillez sélectionner au moins un type de colis.',
        'package_types_min' => 'Veuillez sélectionner au moins un type de colis.',
        'package_types_in' => 'Type de colis sélectionné invalide.',
        'pickup_address_required' => 'L\'adresse de collecte est obligatoire.',
        'pickup_address_min' => 'L\'adresse de collecte doit contenir au moins 5 caractères.',
        'delivery_address_required' => 'L\'adresse de livraison est obligatoire.',
        'delivery_address_min' => 'L\'adresse de livraison doit contenir au moins 5 caractères.',
        'travel_proof_mimes' => 'La preuve de voyage doit être un fichier de type : pdf, jpg, jpeg, png.',
        'travel_proof_max' => 'La preuve de voyage ne doit pas dépasser 5 Mo.',
        'currency_required' => 'La devise est obligatoire.',
        'currency_invalid' => 'La devise sélectionnée n\'est pas valide.',
        'country_required' => 'Le pays est obligatoire.',
        'country_invalid' => 'Le pays sélectionné n\'est pas valide.',
        'city_required' => 'La ville est obligatoire.',
        'city_invalid' => 'La ville sélectionnée n\'est pas valide.',
        'city_country_mismatch' => 'La ville sélectionnée n\'appartient pas au pays sélectionné.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Expéditions
    |--------------------------------------------------------------------------
    */
    'shipment' => [
        'description_required' => 'La description du colis est obligatoire.',
        'description_max' => 'La description du colis ne doit pas dépasser 500 caractères.',
        'description_prohibited' => 'La description du colis contient des articles interdits.',
        'weight_required' => 'Le poids du colis est obligatoire.',
        'weight_min' => 'Le poids du colis doit être d\'au moins 0,1 kg.',
        'weight_max' => 'Le poids du colis ne doit pas dépasser 100 kg.',
        'length_min' => 'La longueur du colis doit être d\'au moins 1 cm.',
        'length_max' => 'La longueur du colis ne doit pas dépasser 500 cm.',
        'width_min' => 'La largeur du colis doit être d\'au moins 1 cm.',
        'width_max' => 'La largeur du colis ne doit pas dépasser 500 cm.',
        'height_min' => 'La hauteur du colis doit être d\'au moins 1 cm.',
        'height_max' => 'La hauteur du colis ne doit pas dépasser 500 cm.',
        'pickup_address_max' => 'L\'adresse de collecte ne doit pas dépasser 500 caractères.',
        'delivery_address_max' => 'L\'adresse de livraison ne doit pas dépasser 500 caractères.',
        'city_country_mismatch' => 'La ville sélectionnée n\'appartient pas au pays sélectionné.',
    ],

    /*
    |--------------------------------------------------------------------------
    | KYC
    |--------------------------------------------------------------------------
    */
    'kyc' => [
        'document_type_required' => 'Le type de document est obligatoire.',
        'document_type_in' => 'Le type de document doit être : passport, idCard ou driversLicense.',
        'document_front_required' => 'Le recto du document est obligatoire.',
        'document_front_file' => 'Le recto du document doit être un fichier valide.',
        'document_front_mimes' => 'Le recto du document doit être de type : jpg, jpeg, png, pdf.',
        'document_front_max' => 'Le recto du document ne doit pas dépasser 5 Mo.',
        'document_back_required' => 'Le verso du document est obligatoire pour les cartes d\'identité.',
        'document_back_file' => 'Le verso du document doit être un fichier valide.',
        'document_back_mimes' => 'Le verso du document doit être de type : jpg, jpeg, png, pdf.',
        'document_back_max' => 'Le verso du document ne doit pas dépasser 5 Mo.',
        'selfie_required' => 'Un selfie est obligatoire.',
        'selfie_file' => 'Le selfie doit être un fichier valide.',
        'selfie_mimes' => 'Le selfie doit être de type : jpg, jpeg, png, pdf.',
        'selfie_max' => 'Le selfie ne doit pas dépasser 5 Mo.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Messages
    |--------------------------------------------------------------------------
    */
    'message' => [
        'recipient_not_self' => 'Vous ne pouvez pas vous envoyer un message à vous-même.',
        'content_max' => 'Le contenu du message ne doit pas dépasser 1000 caractères.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Évaluations
    |--------------------------------------------------------------------------
    */
    'rating' => [
        'to_user_required' => 'L\'utilisateur à évaluer est obligatoire.',
        'to_user_exists' => 'L\'utilisateur à évaluer n\'existe pas.',
        'shipment_required' => 'L\'expédition est obligatoire.',
        'shipment_exists' => 'L\'expédition n\'existe pas.',
        'shipment_not_delivered' => 'L\'expédition doit être livrée avant de pouvoir évaluer.',
        'already_rated' => 'Vous avez déjà évalué cette expédition.',
        'not_involved' => 'Vous devez être impliqué dans cette expédition pour l\'évaluer.',
        'rating_required' => 'La note est obligatoire.',
        'rating_integer' => 'La note doit être un nombre.',
        'rating_min' => 'La note doit être d\'au moins 1.',
        'rating_max' => 'La note ne doit pas dépasser 5.',
        'comment_max' => 'Le commentaire ne doit pas dépasser 500 caractères.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Retraits
    |--------------------------------------------------------------------------
    */
    'withdrawal' => [
        'amount_required' => 'Le montant du retrait est obligatoire.',
        'amount_numeric' => 'Le montant doit être un nombre valide.',
        'amount_min' => 'Le montant minimum de retrait est de 10.',
        'amount_max' => 'Le montant ne peut pas dépasser votre solde disponible.',
        'country_code_required' => 'Le code pays est obligatoire.',
        'country_code_size' => 'Le code pays doit contenir 2 caractères.',
        'country_code_regex' => 'Le code pays doit être au format ISO 3166-1 alpha-2.',
        'currency_required' => 'La devise est obligatoire.',
        'currency_size' => 'La devise doit contenir 3 caractères.',
        'currency_regex' => 'La devise doit être au format ISO 4217.',
        'payment_method_required' => 'Le mode de paiement est obligatoire.',
        'payment_details_required' => 'Les détails de paiement sont obligatoires.',
        'payment_details_array' => 'Les détails de paiement doivent être un tableau.',
    ],
];
