<?php

namespace Tests\Unit\Requests\Trip;

use App\Http\Requests\Trip\SearchTripsRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * Unit tests for SearchTripsRequest validation rules
 * 
 * Validates Requirements: 3.8-3.11
 */
class SearchTripsRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_fields_are_optional(): void
    {
        $request = new SearchTripsRequest();
        $validator = Validator::make([], $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_departure_filter_validation(): void
    {
        $data = ['departure' => 'Paris'];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_arrival_filter_validation(): void
    {
        $data = ['arrival' => 'Dakar'];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_date_from_validation(): void
    {
        $data = ['dateFrom' => now()->format('Y-m-d')];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_date_to_must_be_after_or_equal_date_from(): void
    {
        $data = [
            'dateFrom' => now()->addDays(10)->format('Y-m-d'),
            'dateTo' => now()->addDays(5)->format('Y-m-d'),
        ];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('dateTo', $validator->errors()->toArray());
    }

    public function test_date_to_can_equal_date_from(): void
    {
        $date = now()->addDays(5)->format('Y-m-d');
        $data = [
            'dateFrom' => $date,
            'dateTo' => $date,
        ];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_min_capacity_validation(): void
    {
        $validCapacities = [0.1, 1, 25.5, 50, 100];

        foreach ($validCapacities as $capacity) {
            $data = ['minCapacity' => $capacity];

            $request = new SearchTripsRequest();
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->passes(), "Capacity {$capacity} should be valid");
        }
    }

    public function test_min_capacity_below_minimum_rejected(): void
    {
        $data = ['minCapacity' => 0.05];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('minCapacity', $validator->errors()->toArray());
    }

    public function test_min_capacity_above_maximum_rejected(): void
    {
        $data = ['minCapacity' => 150];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('minCapacity', $validator->errors()->toArray());
    }

    public function test_page_validation(): void
    {
        $data = ['page' => 2];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_page_must_be_positive(): void
    {
        $data = ['page' => 0];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('page', $validator->errors()->toArray());
    }

    public function test_per_page_validation(): void
    {
        $data = ['per_page' => 20];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_per_page_maximum_validation(): void
    {
        $data = ['per_page' => 150];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('per_page', $validator->errors()->toArray());
    }

    public function test_all_filters_combined(): void
    {
        $data = [
            'departure' => 'Paris',
            'arrival' => 'Dakar',
            'dateFrom' => now()->format('Y-m-d'),
            'dateTo' => now()->addDays(30)->format('Y-m-d'),
            'minCapacity' => 10,
            'page' => 1,
            'per_page' => 15,
        ];

        $request = new SearchTripsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }
}
