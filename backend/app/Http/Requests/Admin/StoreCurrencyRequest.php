<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCurrencyRequest extends FormRequest
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
            'code' => ['required', 'string', 'size:3', 'regex:/^[A-Z]{3}$/', 'unique:currencies,code'],
            'symbol' => ['required', 'string', 'max:10'],
            'name' => ['required', 'string', 'max:255'],
            'exchange_rate' => ['required', 'numeric', 'gt:0'],
            'is_active' => ['sometimes', 'boolean'],
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
            'code.regex' => __('messages.currency.code_format'),
            'code.unique' => __('messages.currency.code_unique'),
            'exchange_rate.gt' => __('messages.currency.rate_must_be_positive'),
        ];
    }
}
