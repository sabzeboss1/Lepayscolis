<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustBalanceRequest extends FormRequest
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
            'amount' => ['required', 'numeric', 'not_in:0'],
            'type' => ['required', Rule::in(['credit', 'debit'])],
            'reason' => ['required', 'string', 'min:10', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'Amount is required',
            'amount.not_in' => 'Amount cannot be zero',
            'type.required' => 'Transaction type is required',
            'type.in' => 'Type must be either credit or debit',
            'reason.required' => 'A reason for adjustment is required',
            'reason.min' => 'Reason must be at least 10 characters',
        ];
    }
}
