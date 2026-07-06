<?php

namespace App\Http\Resources\Admin;

use App\Models\PlatformSetting;
use App\Services\CurrencyService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardMetricsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $defaultCurrency = PlatformSetting::getDefaultCurrency();
        $formatted = app(CurrencyService::class)->format($this->resource['revenue_30_days'], $defaultCurrency);

        return [
            'total_users' => $this->resource['total_users'],
            'active_trips' => $this->resource['active_trips'],
            'pending_shipments' => $this->resource['pending_shipments'],
            'revenue_30_days' => $this->resource['revenue_30_days'],
            'revenue_30_days_formatted' => $formatted,
            'currency' => $defaultCurrency,
            'pending_kyc' => $this->resource['pending_kyc'],
            'pending_withdrawals' => $this->resource['pending_withdrawals'],
            'alerts' => $this->resource['alerts'],
        ];
    }
}
