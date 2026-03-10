<?php

namespace Tests\Unit\Requests\Trip;

use App\Http\Requests\Trip\CreateTripRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * Unit tests for CreateTripRequest validation rules
 * 
 * Validates Requirements: 3.3-3.7
 */
class CreateTripRequestTest extends TestCase
{
    use RefreshDatabase;

    private function getValidData(): array
    {
        return [
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->addDays(5)->format('Y-m-d'),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(10)->format('Y-m-d'),
            'available_capacity' => 25.5,
            'price_per_kg' => 50,
        ];
    }

    public function test_valid_data_passes_validation(): void
    {
        $request = new CreateTripRequest();
        $validator = Validator::make($this->getValidData(), $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_departure_city_is_required(): void
    {
        $data = $this->getValidData();
        unset($data['departure_city']);

        $request = new CreateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('departure_city', $validator->errors()->toArray());
    }

    public function test_departure_country_is_required(): void
    {
        $data = $this->getValidData();
        unset($data['departure_country']);

        $request = new CreateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('departure_country', $validator->errors()->toArray());
    }

    public function test_departure_date_must_be_after_today(): void
    {
        $data = $this->getValidData();
        $data['departure_date'] = now()->subDays(1)->format('Y-m-d');

        $request = new CreateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('departure_date', $validator->errors()->toArray());
    }

    public function test_arrival_date_must_be_after_departure_date(): void
    {
        $data = $this->getValidData();
        $data['departure_date'] = now()->addDays(10)->format('Y-m-d');
        $data['arrival_date'] = now()->addDays(5)->format('Y-m-d');

        $request = new CreateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('arrival_date', $validator->errors()->toArray());
    }

    public function test_available_capacity_minimum_validation(): void
    {
        $data = $this->getValidData();
        $data['available_capacity'] = 0.05; // Below minimum

        $request = new CreateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('available_capacity', $validator->errors()->toArray());
    }

    public function test_available_capacity_maximum_validation(): void
    {
        $data = $this->getValidData();
        $data['available_capacity'] = 150; // Above maximum

        $request = new CreateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('available_capacity', $validator->errors()->toArray());
    }

    public function test_available_capacity_accepts_valid_range(): void
    {
        $validCapacities = [0.1, 1, 25.5, 50, 99.9, 100];

        foreach ($validCapacities as $capacity) {
            $data = $this->getValidData();
            $data['available_capacity'] = $capacity;

            $request = new CreateTripRequest();
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->passes(), "Capacity {$capacity} should be valid");
        }
    }

    public function test_price_per_kg_minimum_validation(): void
    {
        $data = $this->getValidData();
        $data['price_per_kg'] = 0.5; // Below minimum

        $request = new CreateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('price_per_kg', $validator->errors()->toArray());
    }

    public function test_price_per_kg_maximum_validation(): void
    {
        $data = $this->getValidData();
        $data['price_per_kg'] = 1500; // Above maximum

        $request = new CreateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('price_per_kg', $validator->errors()->toArray());
    }

    public function test_price_per_kg_accepts_valid_range(): void
    {
        $validPrices = [1, 10, 50, 500, 999, 1000];

        foreach ($validPrices as $price) {
            $data = $this->getValidData();
            $data['price_per_kg'] = $price;

            $request = new CreateTripRequest();
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->passes(), "Price {$price} should be valid");
        }
    }

    public function test_travel_proof_is_optional(): void
    {
        $data = $this->getValidData();
        // No travel_proof field

        $request = new CreateTripRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_all_required_fields_must_be_present(): void
    {
        $requiredFields = [
            'departure_city',
            'departure_country',
            'departure_date',
            'arrival_city',
            'arrival_country',
            'arrival_date',
            'available_capacity',
            'price_per_kg',
        ];

        foreach ($requiredFields as $field) {
            $data = $this->getValidData();
            unset($data[$field]);

            $request = new CreateTripRequest();
            $validator = Validator::make($data, $request->rules());

            $this->assertFalse($validator->passes(), "Field {$field} should be required");
            $this->assertArrayHasKey($field, $validator->errors()->toArray());
        }
    }
}
