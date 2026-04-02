<?php

namespace App\Http\Requests\Trip;

use Illuminate\Foundation\Http\FormRequest;

/**
 * SearchTripsRequest - Validate trip search filters
 * 
 * Validates:
 * - Search filters (departure, arrival, dateFrom, dateTo, minCapacity)
 * - Pagination parameters (page, per_page)
 * 
 * Validates Requirements: 3.8-3.11
 */
class SearchTripsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'departure' => ['nullable', 'string', 'max:255'],
            'arrival' => ['nullable', 'string', 'max:255'],
            'departure_country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'departure_city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'arrival_country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'arrival_city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'dateFrom' => ['nullable', 'date'],
            'dateTo' => ['nullable', 'date', 'after_or_equal:dateFrom'],
            'minCapacity' => ['nullable', 'numeric', 'min:0.1', 'max:100'],
            'traveler_name' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
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
            'dateTo.after_or_equal' => 'The end date must be after or equal to the start date.',
            'minCapacity.min' => 'The minimum capacity must be at least 0.1 kg.',
            'minCapacity.max' => 'The minimum capacity must not exceed 100 kg.',
            'per_page.max' => 'The per page value must not exceed 100.',
        ];
    }
}
