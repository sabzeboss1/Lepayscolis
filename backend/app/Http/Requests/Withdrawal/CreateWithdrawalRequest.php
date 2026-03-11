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
            'amount.required' => __('validation.withdrawal.amount_required'),
            'amount.numeric' => __('validation.withdrawal.amount_numeric'),
            'amount.min' => __('validation.withdrawal.amount_min'),
            'amount.max' => __('validation.withdrawal.amount_max'),
            'country_code.required' => __('validation.withdrawal.country_code_required'),
            'country_code.size' => __('validation.withdrawal.country_code_size'),
            'country_code.regex' => __('validation.withdrawal.country_code_regex'),
            'currency.required' => __('validation.withdrawal.currency_required'),
            'currency.size' => __('validation.withdrawal.currency_size'),
            'currency.regex' => __('validation.withdrawal.currency_regex'),
            'payment_method.required' => __('validation.withdrawal.payment_method_required'),
            'payment_details.required' => __('validation.withdrawal.payment_details_required'),
            'payment_details.array' => __('validation.withdrawal.payment_details_array'),
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
