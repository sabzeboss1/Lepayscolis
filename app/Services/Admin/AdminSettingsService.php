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

        // Cast values to appropriate types
        return [
            'platform_fee_percentage' => (float) ($settings['platform_fee_percentage'] ?? 10.0),
            'withdrawal_fee' => (float) ($settings['withdrawal_fee'] ?? 2.50),
            'min_withdrawal_amount' => (float) ($settings['min_withdrawal_amount'] ?? 20.00),
            'max_withdrawal_amount' => (float) ($settings['max_withdrawal_amount'] ?? 5000.00),
            'min_shipment_price' => (float) ($settings['min_shipment_price'] ?? 10.00),
            'max_shipment_price' => (float) ($settings['max_shipment_price'] ?? 1000.00),
        ];
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
        // Validate platform_fee_percentage (0-100)
        if (isset($data['platform_fee_percentage'])) {
            $fee = $data['platform_fee_percentage'];
            if ($fee < 0 || $fee > 100) {
                throw new \InvalidArgumentException('Platform fee percentage must be between 0 and 100.');
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
