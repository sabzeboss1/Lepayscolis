<?php

namespace App\Http\Requests\Trip;

use Illuminate\Foundation\Http\FormRequest;

/**
 * CreateTripRequest - Validate trip creation data
 * 
 * Validates:
 * - Departure/arrival cities and countries
 * - Dates (departure > today, arrival > departure)
 * - Capacity (0.1-100 kg)
 * - Price (1-1000)
 * - Accepted package types (enveloppes, petits_colis, moyens_colis, grands_colis)
 * - Pickup address (min 5 chars)
 * - Delivery address (min 5 chars)
 * - Travel proof file (optional)
 * 
 * Validates Requirements: 3.3-3.7
 */
class CreateTripRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'departure_city' => ['required', 'string', 'max:255'],
            'departure_country' => ['required', 'string', 'max:255'],
            'departure_date' => ['required', 'date', 'after:today'],
            'arrival_city' => ['required', 'string', 'max:255'],
            'arrival_country' => ['required', 'string', 'max:255'],
            'arrival_date' => ['required', 'date', 'after:departure_date'],
            'available_capacity' => ['required', 'numeric', 'min:0.1', 'max:100'],
            'price_per_kg' => ['required', 'numeric', 'min:1', 'max:1000'],
            'accepted_package_types' => ['required', 'array', 'min:1'],
            'accepted_package_types.*' => ['required', 'string', 'in:enveloppes,petits_colis,moyens_colis,grands_colis'],
            'pickup_address' => ['required', 'string', 'min:5', 'max:1000'],
            'delivery_address' => ['required', 'string', 'min:5', 'max:1000'],
            'travel_proof' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // 5MB
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'departure_date.after' => 'The departure date must be after today.',
            'arrival_date.after' => 'The arrival date must be after the departure date.',
            'available_capacity.min' => 'The available capacity must be at least 0.1 kg.',
            'available_capacity.max' => 'The available capacity must not exceed 100 kg.',
            'price_per_kg.min' => 'The price per kg must be at least 1.',
            'price_per_kg.max' => 'The price per kg must not exceed 1000.',
            'accepted_package_types.required' => 'Please select at least one package type.',
            'accepted_package_types.min' => 'Please select at least one package type.',
            'accepted_package_types.*.in' => 'Invalid package type selected.',
            'pickup_address.required' => 'The pickup address is required.',
            'pickup_address.min' => 'The pickup address must be at least 5 characters.',
            'delivery_address.required' => 'The delivery address is required.',
            'delivery_address.min' => 'The delivery address must be at least 5 characters.',
            'travel_proof.mimes' => 'The travel proof must be a file of type: pdf, jpg, jpeg, png.',
            'travel_proof.max' => 'The travel proof must not exceed 5MB.',
        ];
    }
}
