<?php

namespace App\Http\Requests\Shipment;

use App\Models\City;
use Illuminate\Foundation\Http\FormRequest;

/**
 * CreateShipmentRequest - Validate shipment creation data
 * 
 * Validates:
 * - Package details (description, weight, dimensions)
 * - Pickup and delivery addresses
 * - Prohibited items keywords
 * 
 * Validates Requirements: 4.3-4.7, 13.11
 */
class CreateShipmentRequest extends FormRequest
{
    /**
     * Prohibited items keywords
     */
    private const PROHIBITED_KEYWORDS = [
        'weapon', 'weapons', 'gun', 'guns', 'firearm', 'firearms',
        'drug', 'drugs', 'narcotic', 'narcotics', 'cocaine', 'heroin',
        'explosive', 'explosives', 'bomb', 'bombs', 'ammunition',
        'knife', 'knives', 'blade', 'blades',
        'poison', 'toxic', 'hazardous',
    ];

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
            'package_description' => ['required', 'string', 'max:500'],
            'package_weight' => ['required', 'numeric', 'min:0.1', 'max:100'],
            'package_length' => ['required', 'integer', 'min:1', 'max:500'],
            'package_width' => ['required', 'integer', 'min:1', 'max:500'],
            'package_height' => ['required', 'integer', 'min:1', 'max:500'],
            'pickup_country_id' => ['required', 'integer', 'exists:countries,id'],
            'pickup_city_id' => ['required', 'integer', 'exists:cities,id'],
            'pickup_address' => ['required', 'string', 'max:500'],
            'delivery_country_id' => ['required', 'integer', 'exists:countries,id'],
            'delivery_city_id' => ['required', 'integer', 'exists:cities,id'],
            'delivery_address' => ['required', 'string', 'max:500'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $description = strtolower($this->package_description ?? '');

            foreach (self::PROHIBITED_KEYWORDS as $keyword) {
                if (str_contains($description, $keyword)) {
                    $validator->errors()->add(
                        'package_description',
                        __('validation.shipment.description_prohibited')
                    );
                    break;
                }
            }

            $this->validateCityBelongsToCountry($validator, 'pickup_city_id', 'pickup_country_id');
            $this->validateCityBelongsToCountry($validator, 'delivery_city_id', 'delivery_country_id');
        });
    }

    private function validateCityBelongsToCountry($validator, string $cityField, string $countryField): void
    {
        $cityId = $this->input($cityField);
        $countryId = $this->input($countryField);

        if ($cityId && $countryId) {
            $city = City::find($cityId);
            if ($city && $city->country_id !== (int) $countryId) {
                $validator->errors()->add($cityField, __('validation.shipment.city_country_mismatch'));
            }
        }
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'package_description.required' => __('validation.shipment.description_required'),
            'package_description.max' => __('validation.shipment.description_max'),
            'package_weight.required' => __('validation.shipment.weight_required'),
            'package_weight.min' => __('validation.shipment.weight_min'),
            'package_weight.max' => __('validation.shipment.weight_max'),
            'package_length.min' => __('validation.shipment.length_min'),
            'package_length.max' => __('validation.shipment.length_max'),
            'package_width.min' => __('validation.shipment.width_min'),
            'package_width.max' => __('validation.shipment.width_max'),
            'package_height.min' => __('validation.shipment.height_min'),
            'package_height.max' => __('validation.shipment.height_max'),
            'pickup_address.max' => __('validation.shipment.pickup_address_max'),
            'delivery_address.max' => __('validation.shipment.delivery_address_max'),
        ];
    }
}
