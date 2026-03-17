<?php

namespace App\Http\Requests\Trip;

use App\Models\City;
use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateTripRequest - Validate trip update data
 * 
 * Validates same fields as CreateTripRequest but allows partial updates.
 * All fields are optional to support partial updates.
 * 
 * Validates Requirements: 3.3-3.7, 3.14
 */
class UpdateTripRequest extends FormRequest
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
            'departure_country_id' => ['sometimes', 'integer', 'exists:countries,id'],
            'departure_city_id' => ['sometimes', 'integer', 'exists:cities,id'],
            'departure_date' => ['sometimes', 'date', 'after:today'],
            'arrival_country_id' => ['sometimes', 'integer', 'exists:countries,id'],
            'arrival_city_id' => ['sometimes', 'integer', 'exists:cities,id'],
            'arrival_date' => ['sometimes', 'date', 'after:departure_date'],
            'available_capacity' => ['sometimes', 'numeric', 'min:0.1', 'max:100'],
            'price_per_kg' => ['sometimes', 'numeric', 'min:1', 'max:1000'],
            'currency_code' => ['sometimes', 'string', 'size:3', 'exists:currencies,code'],
            'accepted_package_types' => ['sometimes', 'array', 'min:1'],
            'accepted_package_types.*' => ['required', 'string', 'in:enveloppes,petits_colis,moyens_colis,grands_colis'],
            'pickup_address' => ['sometimes', 'string', 'min:5', 'max:1000'],
            'delivery_address' => ['sometimes', 'string', 'min:5', 'max:1000'],
            'status' => ['sometimes', 'string', 'in:active,completed,cancelled'],
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
            'accepted_package_types.min' => 'Please select at least one package type.',
            'accepted_package_types.*.in' => 'Invalid package type selected.',
            'pickup_address.min' => 'The pickup address must be at least 5 characters.',
            'delivery_address.min' => 'The delivery address must be at least 5 characters.',
            'status.in' => 'The status must be one of: active, completed, cancelled.',
            'travel_proof.mimes' => 'The travel proof must be a file of type: pdf, jpg, jpeg, png.',
            'travel_proof.max' => 'The travel proof must not exceed 5MB.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $this->validateCityBelongsToCountry($validator, 'departure_city_id', 'departure_country_id');
            $this->validateCityBelongsToCountry($validator, 'arrival_city_id', 'arrival_country_id');
        });
    }

    private function validateCityBelongsToCountry($validator, string $cityField, string $countryField): void
    {
        $cityId = $this->input($cityField);
        $countryId = $this->input($countryField);

        if ($cityId && $countryId) {
            $city = City::find($cityId);
            if ($city && $city->country_id !== (int) $countryId) {
                $validator->errors()->add($cityField, __('validation.trip.city_country_mismatch'));
            }
        }
    }
}
