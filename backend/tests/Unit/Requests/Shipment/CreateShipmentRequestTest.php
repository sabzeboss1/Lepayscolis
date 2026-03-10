<?php

namespace Tests\Unit\Requests\Shipment;

use App\Http\Requests\Shipment\CreateShipmentRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * CreateShipmentRequestTest - Test shipment creation validation
 * 
 * Tests:
 * - Package details validation (description, weight, dimensions)
 * - Address validation
 * - Prohibited items detection
 * 
 * Validates Requirements: 4.3-4.7, 13.11
 */
class CreateShipmentRequestTest extends TestCase
{
    private function makeValidator(array $data): \Illuminate\Validation\Validator
    {
        $request = new CreateShipmentRequest();
        return Validator::make($data, $request->rules());
    }

    public function test_valid_shipment_data_passes_validation(): void
    {
        $data = [
            'package_description' => 'Electronics and accessories',
            'package_weight' => 5.5,
            'package_length' => 50,
            'package_width' => 30,
            'package_height' => 20,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Rue de la Paix',
            'delivery_city' => 'Dakar',
            'delivery_country' => 'Senegal',
            'delivery_address' => '456 Avenue Bourguiba',
        ];

        $validator = $this->makeValidator($data);
        $this->assertTrue($validator->passes());
    }

    public function test_package_description_is_required(): void
    {
        $data = $this->validData();
        unset($data['package_description']);

        $validator = $this->makeValidator($data);
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('package_description', $validator->errors()->toArray());
    }

    public function test_package_description_max_length_is_500(): void
    {
        $data = $this->validData();
        $data['package_description'] = str_repeat('a', 501);

        $validator = $this->makeValidator($data);
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('package_description', $validator->errors()->toArray());
    }

    public function test_package_weight_must_be_at_least_0_1(): void
    {
        $data = $this->validData();
        $data['package_weight'] = 0.05;

        $validator = $this->makeValidator($data);
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('package_weight', $validator->errors()->toArray());
    }

    public function test_package_weight_must_not_exceed_100(): void
    {
        $data = $this->validData();
        $data['package_weight'] = 101;

        $validator = $this->makeValidator($data);
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('package_weight', $validator->errors()->toArray());
    }

    public function test_package_dimensions_must_be_at_least_1(): void
    {
        $data = $this->validData();
        $data['package_length'] = 0;

        $validator = $this->makeValidator($data);
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('package_length', $validator->errors()->toArray());
    }

    public function test_package_dimensions_must_not_exceed_500(): void
    {
        $data = $this->validData();
        $data['package_width'] = 501;

        $validator = $this->makeValidator($data);
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('package_width', $validator->errors()->toArray());
    }

    public function test_pickup_address_max_length_is_500(): void
    {
        $data = $this->validData();
        $data['pickup_address'] = str_repeat('a', 501);

        $validator = $this->makeValidator($data);
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('pickup_address', $validator->errors()->toArray());
    }

    public function test_delivery_address_max_length_is_500(): void
    {
        $data = $this->validData();
        $data['delivery_address'] = str_repeat('a', 501);

        $validator = $this->makeValidator($data);
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('delivery_address', $validator->errors()->toArray());
    }

    public function test_prohibited_items_are_detected(): void
    {
        $prohibitedKeywords = [
            'weapon', 'weapons', 'gun', 'guns', 'firearm',
            'drug', 'drugs', 'narcotic', 'cocaine', 'heroin',
            'explosive', 'explosives', 'bomb', 'ammunition',
            'knife', 'blade', 'poison', 'toxic', 'hazardous',
        ];

        foreach ($prohibitedKeywords as $keyword) {
            $data = $this->validData();
            $data['package_description'] = "Package contains {$keyword}";

            $request = new CreateShipmentRequest();
            $request->replace($data);
            $validator = Validator::make($data, $request->rules());
            
            // Manually trigger the withValidator callback
            $request->withValidator($validator);

            $this->assertFalse(
                $validator->passes(),
                "Failed to detect prohibited keyword: {$keyword}"
            );
            $this->assertArrayHasKey('package_description', $validator->errors()->toArray());
        }
    }

    public function test_prohibited_items_detection_is_case_insensitive(): void
    {
        $data = $this->validData();
        $data['package_description'] = 'Package contains WEAPON';

        $request = new CreateShipmentRequest();
        $request->replace($data);
        $validator = Validator::make($data, $request->rules());
        
        // Manually trigger the withValidator callback
        $request->withValidator($validator);

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('package_description', $validator->errors()->toArray());
    }

    private function validData(): array
    {
        return [
            'package_description' => 'Electronics and accessories',
            'package_weight' => 5.5,
            'package_length' => 50,
            'package_width' => 30,
            'package_height' => 20,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Rue de la Paix',
            'delivery_city' => 'Dakar',
            'delivery_country' => 'Senegal',
            'delivery_address' => '456 Avenue Bourguiba',
        ];
    }
}
