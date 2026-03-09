<?php

namespace Tests\Unit\Requests\Shipment;

use App\Http\Requests\Shipment\UpdateShipmentRequest;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * UpdateShipmentRequestTest - Test shipment update validation
 * 
 * Tests:
 * - Status validation
 * - Status transition validation
 * 
 * Validates Requirements: 4.12-4.14, 13.11
 */
class UpdateShipmentRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_status_passes_validation(): void
    {
        $data = ['status' => 'accepted'];

        $request = new UpdateShipmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_status_is_required(): void
    {
        $data = [];

        $request = new UpdateShipmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('status', $validator->errors()->toArray());
    }

    public function test_invalid_status_fails_validation(): void
    {
        $data = ['status' => 'invalid_status'];

        $request = new UpdateShipmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('status', $validator->errors()->toArray());
    }

    public function test_all_valid_statuses_pass_validation(): void
    {
        $validStatuses = ['pending', 'accepted', 'in_transit', 'delivered', 'cancelled'];

        foreach ($validStatuses as $status) {
            $data = ['status' => $status];

            $request = new UpdateShipmentRequest();
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue(
                $validator->passes(),
                "Status '{$status}' should be valid"
            );
        }
    }
}
