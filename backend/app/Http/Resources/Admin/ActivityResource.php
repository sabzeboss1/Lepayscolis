<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'type' => $this->resource['type'],
            'description' => $this->resource['description'],
            'user' => $this->when(isset($this->resource['user']), $this->resource['user']),
            'timestamp' => $this->resource['timestamp'],
            'timestamp_formatted' => $this->resource['timestamp']->format('Y-m-d H:i:s'),
        ];
    }
}
