<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // General
            'platform_name' => ['sometimes', 'string', 'max:255'],
            'platform_url' => ['sometimes', 'string', 'url', 'max:255'],
            'support_email' => ['sometimes', 'string', 'email', 'max:255'],
            'support_phone' => ['sometimes', 'string', 'max:50'],
            'sender_fee_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'traveler_fee_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],

            // SMTP
            'smtp_host' => ['sometimes', 'string', 'max:255'],
            'smtp_port' => ['sometimes', 'integer', 'min:1', 'max:65535'],
            'smtp_username' => ['sometimes', 'string', 'max:255'],
            'smtp_password' => ['sometimes', 'string', 'max:255'],
            'smtp_encryption' => ['sometimes', 'string', 'in:tls,ssl,none'],
            'smtp_from_address' => ['sometimes', 'string', 'email', 'max:255'],
            'smtp_from_name' => ['sometimes', 'string', 'max:255'],

            // Payment - Stripe
            'stripe_public_key' => ['sometimes', 'string', 'max:255'],
            'stripe_secret_key' => ['sometimes', 'string', 'max:255'],
            'stripe_webhook_secret' => ['sometimes', 'string', 'max:255'],

            // Payment - Mobile Money
            'orange_money_api_key' => ['sometimes', 'string', 'max:255'],
            'orange_money_merchant_id' => ['sometimes', 'string', 'max:255'],
            'orange_money_enabled' => ['sometimes', 'boolean'],
            'mtn_money_api_key' => ['sometimes', 'string', 'max:255'],
            'mtn_money_subscription_key' => ['sometimes', 'string', 'max:255'],
            'mtn_money_enabled' => ['sometimes', 'boolean'],

            // Payment - Bank / Cash
            'bank_name' => ['sometimes', 'string', 'max:255'],
            'bank_iban' => ['sometimes', 'string', 'max:50'],
            'bank_bic' => ['sometimes', 'string', 'max:20'],
            'bank_transfer_enabled' => ['sometimes', 'boolean'],
            'cash_payment_enabled' => ['sometimes', 'boolean'],

            // Withdrawal & Shipment
            'withdrawal_fee' => ['sometimes', 'numeric', 'min:0'],
            'min_withdrawal_amount' => ['sometimes', 'numeric', 'min:0'],
            'max_withdrawal_amount' => ['sometimes', 'numeric', 'gt:min_withdrawal_amount'],
            'min_shipment_price' => ['sometimes', 'numeric', 'min:0'],
            'max_shipment_price' => ['sometimes', 'numeric', 'gt:min_shipment_price'],

            // Branding
            'logo_url' => ['sometimes', 'string', 'max:500'],
            'favicon_url' => ['sometimes', 'string', 'max:500'],
            'primary_color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],

            // Currency — must exist in currencies table
            'default_currency' => ['sometimes', 'string', 'exists:currencies,code'],
            'supported_currencies' => ['sometimes', 'array'],
            'supported_currencies.*' => ['string', 'exists:currencies,code'],

            // Security
            'kyc_required' => ['sometimes', 'boolean'],
            'two_factor_enabled' => ['sometimes', 'boolean'],
            'session_timeout' => ['sometimes', 'integer', 'min:300', 'max:86400'],
            'max_login_attempts' => ['sometimes', 'integer', 'min:1', 'max:20'],

            // Notifications
            'email_notifications_enabled' => ['sometimes', 'boolean'],
            'push_notifications_enabled' => ['sometimes', 'boolean'],
            'sms_notifications_enabled' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'sender_fee_percentage.min' => 'Sender fee percentage cannot be negative',
            'sender_fee_percentage.max' => 'Sender fee percentage cannot exceed 100',
            'traveler_fee_percentage.min' => 'Traveler fee percentage cannot be negative',
            'traveler_fee_percentage.max' => 'Traveler fee percentage cannot exceed 100',
            'withdrawal_fee.min' => 'Withdrawal fee cannot be negative',
            'min_withdrawal_amount.min' => 'Minimum withdrawal amount cannot be negative',
            'max_withdrawal_amount.gt' => 'Maximum withdrawal amount must be greater than minimum',
            'min_shipment_price.min' => 'Minimum shipment price cannot be negative',
            'max_shipment_price.gt' => 'Maximum shipment price must be greater than minimum',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // If max values are being updated, ensure we have min values for comparison
        if ($this->has('max_withdrawal_amount') && !$this->has('min_withdrawal_amount')) {
            $this->merge([
                'min_withdrawal_amount' => \App\Models\PlatformSetting::get('min_withdrawal_amount', 20.00),
            ]);
        }

        if ($this->has('max_shipment_price') && !$this->has('min_shipment_price')) {
            $this->merge([
                'min_shipment_price' => \App\Models\PlatformSetting::get('min_shipment_price', 10.00),
            ]);
        }
    }
}
