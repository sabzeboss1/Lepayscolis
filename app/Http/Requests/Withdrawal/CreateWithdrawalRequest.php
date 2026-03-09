<?php

namespace App\Http\Requests\Withdrawal;

use Illuminate\Foundation\Http\FormRequest;

class CreateWithdrawalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by auth:sanctum middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $user = $this->user();
        $maxAmount = $user && $user->wallet ? $user->wallet->balance : 0;

        return [
            'amount' => [
                'required',
                'numeric',
                'min:10',
                "max:{$maxAmount}",
            ],
            'country_code' => [
                'required',
                'string',
                'size:2',
                'regex:/^[A-Z]{2}$/',
            ],
            'currency' => [
                'required',
                'string',
                'size:3',
                'regex:/^[A-Z]{3}$/',
            ],
            'payment_method' => [
                'required',
                'string',
                'max:50',
            ],
            'payment_details' => [
                'required',
                'array',
            ],
            'payment_details.*' => [
                'required',
                'string',
                'max:255',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'Withdrawal amount is required',
            'amount.numeric' => 'Amount must be a valid number',
            'amount.min' => 'Minimum withdrawal amount is 10 EUR',
            'amount.max' => 'Amount cannot exceed your available balance',
            'country_code.required' => 'Country code is required',
            'country_code.size' => 'Country code must be 2 characters',
            'country_code.regex' => 'Country code must be in ISO 3166-1 alpha-2 format',
            'currency.required' => 'Currency is required',
            'currency.size' => 'Currency must be 3 characters',
            'currency.regex' => 'Currency must be in ISO 4217 format',
            'payment_method.required' => 'Payment method is required',
            'payment_details.required' => 'Payment details are required',
            'payment_details.array' => 'Payment details must be an array',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'amount' => 'withdrawal amount',
            'country_code' => 'country code',
            'currency' => 'currency',
            'payment_method' => 'payment method',
            'payment_details' => 'payment details',
        ];
    }
}
