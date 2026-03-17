<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
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
            'sender_fee_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'traveler_fee_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'withdrawal_fee' => ['sometimes', 'numeric', 'min:0'],
            'min_withdrawal_amount' => ['sometimes', 'numeric', 'min:0'],
            'max_withdrawal_amount' => ['sometimes', 'numeric', 'gt:min_withdrawal_amount'],
            'min_shipment_price' => ['sometimes', 'numeric', 'min:0'],
            'max_shipment_price' => ['sometimes', 'numeric', 'gt:min_shipment_price'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'sender_fee_percentage.min' => 'Sender fee percentage cannot be negative',
            'sender_fee_percentage.max' => 'Sender fee percentage cannot exceed 100',
            'traveler_fee_percentage.min' => 'Traveler fee percentage cannot be negative',
            'traveler_fee_percentage.max' => 'Traveler fee percentage cannot exceed 100',
            'withdrawal_fee.min' => 'Withdrawal fee cannot be negative',
            'min_withdrawal_amount.min' => 'Minimum withdrawal amount cannot be negative',
            'max_withdrawal_amount.gt' => 'Maximum withdrawal amount must be greater than minimum',
            'min_shipment_price.min' => 'Minimum shipment price cannot be negative',
            'max_shipment_price.gt' => 'Maximum shipment price must be greater than minimum',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // If max values are being updated, ensure we have min values for comparison
        if ($this->has('max_withdrawal_amount') && !$this->has('min_withdrawal_amount')) {
            $this->merge([
                'min_withdrawal_amount' => \App\Models\PlatformSetting::get('min_withdrawal_amount', 20.00),
            ]);
        }

        if ($this->has('max_shipment_price') && !$this->has('min_shipment_price')) {
            $this->merge([
                'min_shipment_price' => \App\Models\PlatformSetting::get('min_shipment_price', 10.00),
            ]);
        }
    }
}
