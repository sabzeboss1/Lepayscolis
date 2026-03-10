<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnalyticsDataResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'labels' => $this->when(isset($this->resource['labels']), $this->resource['labels']),
            'values' => $this->when(isset($this->resource['values']), $this->resource['values']),
            'routes' => $this->when(isset($this->resource['routes']), $this->resource['routes']),
            'total_users' => $this->when(isset($this->resource['total_users']), $this->resource['total_users']),
            'active_users' => $this->when(isset($this->resource['active_users']), $this->resource['active_users']),
            'active_user_percentage' => $this->when(isset($this->resource['active_user_percentage']), $this->resource['active_user_percentage']),
            'avg_trips_per_user' => $this->when(isset($this->resource['avg_trips_per_user']), $this->resource['avg_trips_per_user']),
            'avg_shipments_per_user' => $this->when(isset($this->resource['avg_shipments_per_user']), $this->resource['avg_shipments_per_user']),
        ];
    }
}
