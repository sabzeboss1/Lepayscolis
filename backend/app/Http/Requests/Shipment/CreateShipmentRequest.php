<?php

namespace App\Http\Requests\Shipment;

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
            'pickup_city' => ['required', 'string', 'max:255'],
            'pickup_country' => ['required', 'string', 'max:255'],
            'pickup_address' => ['required', 'string', 'max:500'],
            'delivery_city' => ['required', 'string', 'max:255'],
            'delivery_country' => ['required', 'string', 'max:255'],
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
                        'The package description contains prohibited items.'
                    );
                    break;
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
            'package_description.required' => 'Package description is required.',
            'package_description.max' => 'Package description must not exceed 500 characters.',
            'package_weight.required' => 'Package weight is required.',
            'package_weight.min' => 'Package weight must be at least 0.1 kg.',
            'package_weight.max' => 'Package weight must not exceed 100 kg.',
            'package_length.min' => 'Package length must be at least 1 cm.',
            'package_length.max' => 'Package length must not exceed 500 cm.',
            'package_width.min' => 'Package width must be at least 1 cm.',
            'package_width.max' => 'Package width must not exceed 500 cm.',
            'package_height.min' => 'Package height must be at least 1 cm.',
            'package_height.max' => 'Package height must not exceed 500 cm.',
            'pickup_address.max' => 'Pickup address must not exceed 500 characters.',
            'delivery_address.max' => 'Delivery address must not exceed 500 characters.',
        ];
    }
}
