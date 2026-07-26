<?php

namespace App\Http\Requests\Trip;

use App\Models\City;
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
 * - Travel proof file (required)
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
        // Get dynamic price limits from platform settings
        $minPrice = \App\Models\PlatformSetting::get('min_shipment_price', 1);
        $maxPrice = \App\Models\PlatformSetting::get('max_shipment_price', 1000);

        return [
            'departure_country_id' => ['required', 'integer', 'exists:countries,id'],
            'departure_city_id' => ['required', 'integer', 'exists:cities,id'],
            'departure_date' => ['required', 'date', 'after_or_equal:today'],
            'arrival_country_id' => ['required', 'integer', 'exists:countries,id'],
            'arrival_city_id' => ['required', 'integer', 'exists:cities,id'],
            'arrival_date' => ['required', 'date', 'after:departure_date'],
            'available_capacity' => ['required', 'numeric', 'min:0.1', 'max:100'],
            'price_per_kg' => ['required', 'numeric', "min:{$minPrice}", "max:{$maxPrice}"],
            'currency_code' => ['required', 'string', 'size:3', 'exists:currencies,code'],
            'accepted_package_types' => ['required', 'array', 'min:1'],
            'accepted_package_types.*' => ['required', 'string', 'in:enveloppes,petits_colis,moyens_colis,grands_colis'],
            'pickup_address' => ['nullable', 'string', 'min:5', 'max:1000'],
            'delivery_address' => ['nullable', 'string', 'min:5', 'max:1000'],
            'travel_proof' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:' . config('upload.max_filesize', 25600)], // 25MB in KB - Optional
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
            'travel_proof.required' => __('validation.trip.travel_proof_required'),
            'travel_proof.mimes' => __('validation.trip.travel_proof_mimes'),
            'travel_proof.max' => __('validation.trip.travel_proof_max'),
            'departure_country_id.required' => __('validation.trip.country_required'),
            'departure_country_id.exists' => __('validation.trip.country_invalid'),
            'departure_city_id.required' => __('validation.trip.city_required'),
            'departure_city_id.exists' => __('validation.trip.city_invalid'),
            'arrival_country_id.required' => __('validation.trip.country_required'),
            'arrival_country_id.exists' => __('validation.trip.country_invalid'),
            'arrival_city_id.required' => __('validation.trip.city_required'),
            'arrival_city_id.exists' => __('validation.trip.city_invalid'),
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $this->validateCityBelongsToCountry($validator, 'departure_city_id', 'departure_country_id');
            $this->validateCityBelongsToCountry($validator, 'arrival_city_id', 'arrival_country_id');
            $this->validateRussiaAfricaRoute($validator);
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

    private function validateRussiaAfricaRoute($validator): void
    {
        $depCountryId = $this->input('departure_country_id');
        $arrCountryId = $this->input('arrival_country_id');

        if ($depCountryId && $arrCountryId) {
            if ((int) $depCountryId === (int) $arrCountryId) {
                $validator->errors()->add('arrival_country_id', 'Le pays de départ et le pays d\'arrivée doivent être différents.');
                return;
            }

            $depCountry = \App\Models\Country::find($depCountryId);
            $arrCountry = \App\Models\Country::find($arrCountryId);

            if ($depCountry && $arrCountry) {
                $isDepRussia = str_contains(strtolower($depCountry->name), 'russia') || str_contains(strtolower($depCountry->name), 'russie') || strtoupper($depCountry->code ?? '') === 'RU';
                $isArrRussia = str_contains(strtolower($arrCountry->name), 'russia') || str_contains(strtolower($arrCountry->name), 'russie') || strtoupper($arrCountry->code ?? '') === 'RU';

                if (($isDepRussia && $isArrRussia) || (!$isDepRussia && !$isArrRussia)) {
                    $validator->errors()->add('arrival_country_id', 'Le trajet doit obligatoirement s\'effectuer entre la Russie et un pays d\'Afrique.');
                }
            }
        }
    }
}
