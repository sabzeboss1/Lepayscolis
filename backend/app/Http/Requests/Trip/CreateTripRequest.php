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
            'currency_code' => ['required', 'string', 'size:3', 'exists:currencies,code'],
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
            'departure_date.after' => __('validation.trip.departure_date_after'),
            'arrival_date.after' => __('validation.trip.arrival_date_after'),
            'available_capacity.min' => __('validation.trip.capacity_min'),
            'available_capacity.max' => __('validation.trip.capacity_max'),
            'price_per_kg.min' => __('validation.trip.price_min'),
            'price_per_kg.max' => __('validation.trip.price_max'),
            'accepted_package_types.required' => __('validation.trip.package_types_required'),
            'accepted_package_types.min' => __('validation.trip.package_types_min'),
            'accepted_package_types.*.in' => __('validation.trip.package_types_in'),
            'pickup_address.required' => __('validation.trip.pickup_address_required'),
            'pickup_address.min' => __('validation.trip.pickup_address_min'),
            'delivery_address.required' => __('validation.trip.delivery_address_required'),
            'delivery_address.min' => __('validation.trip.delivery_address_min'),
            'currency_code.required' => __('validation.trip.currency_required'),
            'currency_code.exists' => __('validation.trip.currency_invalid'),
            'travel_proof.mimes' => __('validation.trip.travel_proof_mimes'),
            'travel_proof.max' => __('validation.trip.travel_proof_max'),
        ];
    }
}
