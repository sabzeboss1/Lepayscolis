<?php

namespace Tests\Unit\Requests\Trip;

use App\Http\Requests\Trip\UpdateTripRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * Unit tests for UpdateTripRequest validation rules
 * 
 * Validates Requirements: 3.3-3.7, 3.14
 */
class UpdateTripRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_fields_are_optional(): void
    {
        $request = new UpdateTripRequest();
        $validator = Validator::make([], $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_partial_update_with_single_field(): void
    {
        $data = ['available_capacity' => 30];

        $request = new UpdateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_departure_date_validation_when_provided(): void
    {
        $data = ['departure_date' => now()->subDays(1)->format('Y-m-d')];

        $request = new UpdateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('departure_date', $validator->errors()->toArray());
    }

    public function test_arrival_date_validation_when_provided(): void
    {
        $data = [
            'departure_date' => now()->addDays(10)->format('Y-m-d'),
            'arrival_date' => now()->addDays(5)->format('Y-m-d'),
        ];

        $request = new UpdateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('arrival_date', $validator->errors()->toArray());
    }

    public function test_capacity_validation_when_provided(): void
    {
        $invalidCapacities = [0.05, 150];

        foreach ($invalidCapacities as $capacity) {
            $data = ['available_capacity' => $capacity];

            $request = new UpdateTripRequest();
            $validator = Validator::make($data, $request->rules());

            $this->assertFalse($validator->passes(), "Capacity {$capacity} should be invalid");
        }
    }

    public function test_price_validation_when_provided(): void
    {
        $invalidPrices = [0.5, 1500];

        foreach ($invalidPrices as $price) {
            $data = ['price_per_kg' => $price];

            $request = new UpdateTripRequest();
            $validator = Validator::make($data, $request->rules());

            $this->assertFalse($validator->passes(), "Price {$price} should be invalid");
        }
    }

    public function test_status_validation(): void
    {
        $validStatuses = ['active', 'completed', 'cancelled'];

        foreach ($validStatuses as $status) {
            $data = ['status' => $status];

            $request = new UpdateTripRequest();
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->passes(), "Status {$status} should be valid");
        }
    }

    public function test_invalid_status_rejected(): void
    {
        $data = ['status' => 'invalid_status'];

        $request = new UpdateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('status', $validator->errors()->toArray());
    }

    public function test_multiple_fields_update(): void
    {
        $data = [
            'available_capacity' => 40,
            'price_per_kg' => 75,
            'status' => 'active',
        ];

        $request = new UpdateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }
}
