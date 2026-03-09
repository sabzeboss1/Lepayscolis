<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTripRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'departure_date' => ['sometimes', 'date', 'after:today'],
            'arrival_date' => ['sometimes', 'date', 'after:departure_date'],
            'available_space' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'price_per_kg' => ['sometimes', 'numeric', 'min:0'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'departure_date.after' => 'Departure date must be in the future',
            'arrival_date.after' => 'Arrival date must be after departure date',
            'available_space.min' => 'Available space cannot be negative',
            'price_per_kg.min' => 'Price per kg cannot be negative',
        ];
    }
}
