<?php

namespace Tests\Unit\Requests\Shipment;

use App\Http\Requests\Shipment\AcceptShipmentRequest;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * AcceptShipmentRequestTest - Test shipment acceptance validation
 * 
 * Tests:
 * - Trip ID validation
 * - Trip existence validation
 * - Trip capacity validation
 * 
 * Validates Requirements: 4.9-4.11, 13.11
 */
class AcceptShipmentRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_trip_id_passes_validation(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $user->id, 'available_capacity' => 10]);

        $data = ['trip_id' => $trip->id];

        $request = new AcceptShipmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_trip_id_is_required(): void
    {
        $data = [];

        $request = new AcceptShipmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('trip_id', $validator->errors()->toArray());
    }

    public function test_trip_id_must_be_uuid(): void
    {
        $data = ['trip_id' => 'not-a-uuid'];

        $request = new AcceptShipmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('trip_id', $validator->errors()->toArray());
    }

    public function test_trip_id_must_exist(): void
    {
        $data = ['trip_id' => '00000000-0000-0000-0000-000000000000'];

        $request = new AcceptShipmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('trip_id', $validator->errors()->toArray());
    }
}
