<?php

namespace App\Http\Requests\Shipment;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateShipmentRequest - Validate shipment update data
 * 
 * Validates:
 * - Status transitions
 * - Allowed status updates
 * 
 * Validates Requirements: 4.12-4.14, 13.11
 */
class UpdateShipmentRequest extends FormRequest
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
            'status' => ['required', 'string', 'in:pending,accepted,in_transit,delivered,cancelled'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $shipmentId = $this->route('id');
            $shipment = \App\Models\Shipment::find($shipmentId);
            
            if ($shipment && !$shipment->canTransitionTo($this->status)) {
                $validator->errors()->add(
                    'status',
                    "Cannot transition from {$shipment->status} to {$this->status}."
                );
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
            'status.required' => 'Status is required.',
            'status.in' => 'Invalid status value.',
        ];
    }
}
