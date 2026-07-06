<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class AdminSettingsService
{
    public function getSettings(): array
    {
        $settings = PlatformSetting::all()->pluck('value', 'key')->toArray();

        // Cast values to appropriate types based on the stored type
        $result = [];
        foreach (PlatformSetting::all() as $setting) {
            $result[$setting->key] = PlatformSetting::castValue($setting->value, $setting->type);
        }

        // Return all settings with defaults for missing ones
        return array_merge([
            // General
            'platform_name' => 'Le Pays Express Colis',
            'platform_url' => 'https://lepaysexpresscolis.com',
            'support_email' => 'support@lepaysexpresscolis.com',
            'support_phone' => '+33 1 23 45 67 89',
            'sender_fee_percentage' => 1.0,
            'traveler_fee_percentage' => 2.0,
            
            // SMTP
            'smtp_host' => 'smtp.gmail.com',
            'smtp_port' => 587,
            'smtp_username' => '',
            'smtp_password' => '',
            'smtp_encryption' => 'tls',
            'smtp_from_address' => 'noreply@lepaysexpresscolis.com',
            'smtp_from_name' => 'Le Pays Express Colis',
            
            // Payment
            'stripe_public_key' => '',
            'stripe_secret_key' => '',
            'stripe_webhook_secret' => '',
            'orange_money_api_key' => '',
            'orange_money_merchant_id' => '',
            'orange_money_enabled' => false,
            'mtn_money_api_key' => '',
            'mtn_money_subscription_key' => '',
            'mtn_money_enabled' => false,
            'bank_name' => '',
            'bank_iban' => '',
            'bank_bic' => '',
            'bank_transfer_enabled' => false,
            'cash_payment_enabled' => false,
            
            // Withdrawal & Shipment
            'withdrawal_fee' => 2.50,
            'min_withdrawal_amount' => 20.00,
            'max_withdrawal_amount' => 5000.00,
            'min_shipment_price' => 10.00,
            'max_shipment_price' => 1000.00,
            
            // Branding
            'logo_url' => '/logo.png',
            'favicon_url' => '/favicon.ico',
            'primary_color' => '#3B82F6',
            'secondary_color' => '#F97316',
            
            // Currency
            'default_currency' => PlatformSetting::getDefaultCurrency(),
            'supported_currencies' => ['XAF', 'USD', 'GBP', 'XOF', 'RUB', 'CAD'],
            
            // Security
            'kyc_required' => true,
            'two_factor_enabled' => false,
            'session_timeout' => 3600,
            'max_login_attempts' => 5,
            
            // Notifications
            'email_notifications_enabled' => true,
            'push_notifications_enabled' => true,
            'sms_notifications_enabled' => false,
        ], $result);
    }

    public function updateSettings(array $data, User $admin): array
    {
        // Validate ranges
        $this->validateSettings($data);

        $before = $this->getSettings();

        foreach ($data as $key => $value) {
            PlatformSetting::set($key, $value, $admin->id);
        }

        $after = $this->getSettings();

        // Clear all settings cache
        Cache::flush();

        // Create audit log
        AuditLog::log($admin, 'update', 'settings', 0, $before, $after);

        return $after;
    }

    protected function validateSettings(array $data): void
    {
        // Validate sender_fee_percentage (0-100)
        if (isset($data['sender_fee_percentage'])) {
            $fee = $data['sender_fee_percentage'];
            if ($fee < 0 || $fee > 100) {
                throw new \InvalidArgumentException('Sender fee percentage must be between 0 and 100.');
            }
        }

        // Validate traveler_fee_percentage (0-100)
        if (isset($data['traveler_fee_percentage'])) {
            $fee = $data['traveler_fee_percentage'];
            if ($fee < 0 || $fee > 100) {
                throw new \InvalidArgumentException('Traveler fee percentage must be between 0 and 100.');
            }
        }

        // Validate withdrawal_fee (>= 0)
        if (isset($data['withdrawal_fee'])) {
            if ($data['withdrawal_fee'] < 0) {
                throw new \InvalidArgumentException('Withdrawal fee must be >= 0.');
            }
        }

        // Validate min_withdrawal_amount (>= 0)
        if (isset($data['min_withdrawal_amount'])) {
            if ($data['min_withdrawal_amount'] < 0) {
                throw new \InvalidArgumentException('Minimum withdrawal amount must be >= 0.');
            }
        }

        // Validate max > min for withdrawal amounts
        $minWithdrawal = $data['min_withdrawal_amount'] ?? PlatformSetting::get('min_withdrawal_amount', 20);
        $maxWithdrawal = $data['max_withdrawal_amount'] ?? PlatformSetting::get('max_withdrawal_amount', 5000);

        if ($maxWithdrawal <= $minWithdrawal) {
            throw new \InvalidArgumentException('Maximum withdrawal amount must be greater than minimum.');
        }

        // Validate min_shipment_price (>= 0)
        if (isset($data['min_shipment_price'])) {
            if ($data['min_shipment_price'] < 0) {
                throw new \InvalidArgumentException('Minimum shipment price must be >= 0.');
            }
        }

        // Validate max > min for shipment prices
        $minShipment = $data['min_shipment_price'] ?? PlatformSetting::get('min_shipment_price', 10);
        $maxShipment = $data['max_shipment_price'] ?? PlatformSetting::get('max_shipment_price', 1000);

        if ($maxShipment <= $minShipment) {
            throw new \InvalidArgumentException('Maximum shipment price must be greater than minimum.');
        }
    }
}
