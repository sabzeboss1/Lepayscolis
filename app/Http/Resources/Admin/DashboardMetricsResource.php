<?php

namespace App\Http\Resources\Admin;

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
        return [
            'total_users' => $this->resource['total_users'],
            'active_trips' => $this->resource['active_trips'],
            'pending_shipments' => $this->resource['pending_shipments'],
            'revenue_30_days' => $this->resource['revenue_30_days'],
            'revenue_30_days_formatted' => number_format($this->resource['revenue_30_days'], 2) . ' USD',
            'pending_kyc' => $this->resource['pending_kyc'],
            'pending_withdrawals' => $this->resource['pending_withdrawals'],
            'alerts' => $this->resource['alerts'],
        ];
    }
}
