<?php

namespace App\Http\Requests\Shipment;

use App\Models\Trip;
use Illuminate\Foundation\Http\FormRequest;

/**
 * AcceptShipmentRequest - Validate shipment acceptance data
 * 
 * Validates:
 * - Trip exists
 * - Trip has sufficient capacity
 * 
 * Validates Requirements: 4.9-4.11, 13.11
 */
class AcceptShipmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'trip_id' => ['required', 'uuid', 'exists:trips,id'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $tripId = $this->trip_id;
            $shipmentId = $this->route('id');
            
            if ($tripId && $shipmentId) {
                $trip = Trip::find($tripId);
                $shipment = \App\Models\Shipment::find($shipmentId);

                if ($shipment && $shipment->status !== 'pending') {
                    $validator->errors()->add(
                        'shipment',
                        __('validation.shipment.not_pending')
                    );
                }

                if ($trip && $shipment) {
                    // Check if trip has sufficient capacity
                    if (!$trip->hasCapacityFor((float) $shipment->package_weight)) {
                        $validator->errors()->add(
                            'trip_id',
                            __('validation.shipment.insufficient_capacity')
                        );
                    }

                    // Check if trip belongs to the authenticated user
                    if ($trip->traveler_id !== auth()->id()) {
                        $validator->errors()->add(
                            'trip_id',
                            __('validation.shipment.not_trip_owner')
                        );
                    }
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'trip_id.required' => 'Trip ID is required.',
            'trip_id.uuid' => 'Trip ID must be a valid UUID.',
            'trip_id.exists' => 'The selected trip does not exist.',
        ];
    }
}
