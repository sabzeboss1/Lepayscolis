<?php

namespace Database\Seeders;

use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class PlatformSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General
            ['key' => 'platform_name', 'value' => 'Le Pays Express Colis', 'type' => 'string', 'description' => 'Nom de la plateforme'],
            ['key' => 'platform_url', 'value' => 'https://lepaysexpresscolis.com', 'type' => 'string', 'description' => 'URL de la plateforme'],
            ['key' => 'support_email', 'value' => 'support@lepaysexpresscolis.com', 'type' => 'string', 'description' => 'Email de support'],
            ['key' => 'support_phone', 'value' => '+33 1 23 45 67 89', 'type' => 'string', 'description' => 'Téléphone de support'],
            ['key' => 'sender_fee_percentage', 'value' => '1.0', 'type' => 'float', 'description' => 'Commission appliquée à l\'expéditeur (ajoutée au prix de base)'],
            ['key' => 'traveler_fee_percentage', 'value' => '2.0', 'type' => 'float', 'description' => 'Commission appliquée au voyageur (déduite du prix de base)'],

            // SMTP
            ['key' => 'smtp_host', 'value' => 'smtp.gmail.com', 'type' => 'string', 'description' => 'Hôte SMTP'],
            ['key' => 'smtp_port', 'value' => '587', 'type' => 'integer', 'description' => 'Port SMTP'],
            ['key' => 'smtp_username', 'value' => '', 'type' => 'string', 'description' => 'Nom d\'utilisateur SMTP'],
            ['key' => 'smtp_password', 'value' => '', 'type' => 'string', 'description' => 'Mot de passe SMTP'],
            ['key' => 'smtp_encryption', 'value' => 'tls', 'type' => 'string', 'description' => 'Chiffrement SMTP'],
            ['key' => 'smtp_from_address', 'value' => 'noreply@lepaysexpresscolis.com', 'type' => 'string', 'description' => 'Adresse d\'expéditeur'],
            ['key' => 'smtp_from_name', 'value' => 'Le Pays Express Colis', 'type' => 'string', 'description' => 'Nom d\'expéditeur'],

            // Payment - Stripe
            ['key' => 'stripe_public_key', 'value' => '', 'type' => 'string', 'description' => 'Clé publique Stripe'],
            ['key' => 'stripe_secret_key', 'value' => '', 'type' => 'string', 'description' => 'Clé secrète Stripe'],
            ['key' => 'stripe_webhook_secret', 'value' => '', 'type' => 'string', 'description' => 'Secret webhook Stripe'],
            ['key' => 'payment_currency', 'value' => 'EUR', 'type' => 'string', 'description' => 'Devise de paiement'],

            // Payment - Orange Money
            ['key' => 'orange_money_api_key', 'value' => '', 'type' => 'string', 'description' => 'Clé API Orange Money'],
            ['key' => 'orange_money_merchant_id', 'value' => '', 'type' => 'string', 'description' => 'ID marchand Orange Money'],
            ['key' => 'orange_money_enabled', 'value' => 'false', 'type' => 'boolean', 'description' => 'Activer Orange Money'],

            // Payment - MTN Money
            ['key' => 'mtn_money_api_key', 'value' => '', 'type' => 'string', 'description' => 'Clé API MTN Money'],
            ['key' => 'mtn_money_subscription_key', 'value' => '', 'type' => 'string', 'description' => 'Clé d\'abonnement MTN Money'],
            ['key' => 'mtn_money_enabled', 'value' => 'false', 'type' => 'boolean', 'description' => 'Activer MTN Money'],

            // Payment - Bank Transfer
            ['key' => 'bank_name', 'value' => '', 'type' => 'string', 'description' => 'Nom de la banque'],
            ['key' => 'bank_iban', 'value' => '', 'type' => 'string', 'description' => 'IBAN'],
            ['key' => 'bank_bic', 'value' => '', 'type' => 'string', 'description' => 'BIC/SWIFT'],
            ['key' => 'bank_transfer_enabled', 'value' => 'false', 'type' => 'boolean', 'description' => 'Activer virement bancaire'],

            // Payment - Cash
            ['key' => 'cash_payment_enabled', 'value' => 'false', 'type' => 'boolean', 'description' => 'Activer paiement en espèces'],

            // Withdrawal
            ['key' => 'withdrawal_fee', 'value' => '2.50', 'type' => 'float', 'description' => 'Frais de retrait'],
            ['key' => 'min_withdrawal_amount', 'value' => '20.00', 'type' => 'float', 'description' => 'Montant minimum de retrait'],
            ['key' => 'max_withdrawal_amount', 'value' => '5000.00', 'type' => 'float', 'description' => 'Montant maximum de retrait'],

            // Shipment
            ['key' => 'min_shipment_price', 'value' => '10.00', 'type' => 'float', 'description' => 'Prix minimum d\'expédition'],
            ['key' => 'max_shipment_price', 'value' => '1000.00', 'type' => 'float', 'description' => 'Prix maximum d\'expédition'],

            // Branding
            ['key' => 'logo_url', 'value' => '/logo.png', 'type' => 'string', 'description' => 'URL du logo'],
            ['key' => 'favicon_url', 'value' => '/favicon.ico', 'type' => 'string', 'description' => 'URL du favicon'],
            ['key' => 'primary_color', 'value' => '#3B82F6', 'type' => 'string', 'description' => 'Couleur primaire'],
            ['key' => 'secondary_color', 'value' => '#F97316', 'type' => 'string', 'description' => 'Couleur secondaire'],

            // Currency
            ['key' => 'default_currency', 'value' => 'RUB', 'type' => 'string', 'description' => 'Devise par défaut'],
            ['key' => 'supported_currencies', 'value' => json_encode(['RUB', 'XAF']), 'type' => 'json', 'description' => 'Devises supportées'],

            // Security
            ['key' => 'kyc_required', 'value' => 'true', 'type' => 'boolean', 'description' => 'KYC obligatoire'],
            ['key' => 'two_factor_enabled', 'value' => 'false', 'type' => 'boolean', 'description' => 'Authentification à deux facteurs'],
            ['key' => 'session_timeout', 'value' => '3600', 'type' => 'integer', 'description' => 'Timeout de session en secondes'],
            ['key' => 'max_login_attempts', 'value' => '5', 'type' => 'integer', 'description' => 'Tentatives de connexion maximum'],

            // Notifications
            ['key' => 'email_notifications_enabled', 'value' => 'true', 'type' => 'boolean', 'description' => 'Notifications par email'],
            ['key' => 'push_notifications_enabled', 'value' => 'true', 'type' => 'boolean', 'description' => 'Notifications push'],
            ['key' => 'sms_notifications_enabled', 'value' => 'false', 'type' => 'boolean', 'description' => 'Notifications SMS'],
        ];

        foreach ($settings as $setting) {
            PlatformSetting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                    'description' => $setting['description'],
                ]
            );
        }

        $this->command->info('Platform settings seeded successfully!');
    }
}
