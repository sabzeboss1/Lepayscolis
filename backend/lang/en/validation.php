<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */
    'auth' => [
        'email_required' => 'The email address is required.',
        'email_email' => 'Please provide a valid email address.',
        'email_unique' => 'This email address is already registered.',
        'password_required' => 'The password is required.',
        'password_min' => 'The password must be at least 8 characters.',
        'name_required' => 'The name is required.',
        'phone_required' => 'The phone number is required.',
        'phone_unique' => 'This phone number is already registered.',
        'phone_regex' => 'The phone number must be in international format (e.g., +33612345678).',
        'locale_required' => 'The locale is required.',
        'locale_in' => 'The locale must be either fr or en.',
        'invalid_credentials' => 'The provided credentials are incorrect.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Trips
    |--------------------------------------------------------------------------
    */
    'trip' => [
        'departure_date_after' => 'The departure date must be after today.',
        'arrival_date_after' => 'The arrival date must be after the departure date.',
        'capacity_min' => 'The available capacity must be at least 0.1 kg.',
        'capacity_max' => 'The available capacity must not exceed 100 kg.',
        'price_min' => 'The price per kg must be at least 1.',
        'price_max' => 'The price per kg must not exceed 1000.',
        'package_types_required' => 'Please select at least one package type.',
        'package_types_min' => 'Please select at least one package type.',
        'package_types_in' => 'Invalid package type selected.',
        'pickup_address_required' => 'The pickup address is required.',
        'pickup_address_min' => 'The pickup address must be at least 5 characters.',
        'delivery_address_required' => 'The delivery address is required.',
        'delivery_address_min' => 'The delivery address must be at least 5 characters.',
        'travel_proof_mimes' => 'The travel proof must be a file of type: pdf, jpg, jpeg, png.',
        'travel_proof_max' => 'The travel proof must not exceed 5MB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Shipments
    |--------------------------------------------------------------------------
    */
    'shipment' => [
        'description_required' => 'Package description is required.',
        'description_max' => 'Package description must not exceed 500 characters.',
        'description_prohibited' => 'The package description contains prohibited items.',
        'weight_required' => 'Package weight is required.',
        'weight_min' => 'Package weight must be at least 0.1 kg.',
        'weight_max' => 'Package weight must not exceed 100 kg.',
        'length_min' => 'Package length must be at least 1 cm.',
        'length_max' => 'Package length must not exceed 500 cm.',
        'width_min' => 'Package width must be at least 1 cm.',
        'width_max' => 'Package width must not exceed 500 cm.',
        'height_min' => 'Package height must be at least 1 cm.',
        'height_max' => 'Package height must not exceed 500 cm.',
        'pickup_address_max' => 'Pickup address must not exceed 500 characters.',
        'delivery_address_max' => 'Delivery address must not exceed 500 characters.',
    ],

    /*
    |--------------------------------------------------------------------------
    | KYC
    |--------------------------------------------------------------------------
    */
    'kyc' => [
        'document_type_required' => 'The document type is required.',
        'document_type_in' => 'The document type must be one of: passport, idCard, driversLicense.',
        'document_front_required' => 'The front of the document is required.',
        'document_front_file' => 'The document front must be a valid file.',
        'document_front_mimes' => 'The document front must be a file of type: jpg, jpeg, png, pdf.',
        'document_front_max' => 'The document front must not exceed 5MB.',
        'document_back_required' => 'The back of the document is required for ID cards.',
        'document_back_file' => 'The document back must be a valid file.',
        'document_back_mimes' => 'The document back must be a file of type: jpg, jpeg, png, pdf.',
        'document_back_max' => 'The document back must not exceed 5MB.',
        'selfie_required' => 'A selfie is required.',
        'selfie_file' => 'The selfie must be a valid file.',
        'selfie_mimes' => 'The selfie must be a file of type: jpg, jpeg, png, pdf.',
        'selfie_max' => 'The selfie must not exceed 5MB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Messages
    |--------------------------------------------------------------------------
    */
    'message' => [
        'recipient_not_self' => 'You cannot send a message to yourself.',
        'content_max' => 'Message content cannot exceed 1000 characters.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Ratings
    |--------------------------------------------------------------------------
    */
    'rating' => [
        'to_user_required' => 'The user to rate is required.',
        'to_user_exists' => 'The user to rate does not exist.',
        'shipment_required' => 'The shipment is required.',
        'shipment_exists' => 'The shipment does not exist.',
        'shipment_not_delivered' => 'Shipment must be delivered before rating.',
        'already_rated' => 'You have already rated this shipment.',
        'not_involved' => 'You must be involved in this shipment to rate it.',
        'rating_required' => 'The rating is required.',
        'rating_integer' => 'The rating must be a number.',
        'rating_min' => 'The rating must be at least 1.',
        'rating_max' => 'The rating must not exceed 5.',
        'comment_max' => 'The comment must not exceed 500 characters.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Withdrawals
    |--------------------------------------------------------------------------
    */
    'withdrawal' => [
        'amount_required' => 'Withdrawal amount is required.',
        'amount_numeric' => 'Amount must be a valid number.',
        'amount_min' => 'Minimum withdrawal amount is 10.',
        'amount_max' => 'Amount cannot exceed your available balance.',
        'country_code_required' => 'Country code is required.',
        'country_code_size' => 'Country code must be 2 characters.',
        'country_code_regex' => 'Country code must be in ISO 3166-1 alpha-2 format.',
        'currency_required' => 'Currency is required.',
        'currency_size' => 'Currency must be 3 characters.',
        'currency_regex' => 'Currency must be in ISO 4217 format.',
        'payment_method_required' => 'Payment method is required.',
        'payment_details_required' => 'Payment details are required.',
        'payment_details_array' => 'Payment details must be an array.',
    ],
];
