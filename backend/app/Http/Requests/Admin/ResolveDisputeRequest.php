<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ResolveDisputeRequest extends FormRequest
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
            'resolution_notes' => ['required', 'string', 'min:10', 'max:1000'],
            'refund_amount' => ['sometimes', 'numeric', 'min:0'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'resolution_notes.required' => 'Resolution notes are required',
            'resolution_notes.min' => 'Resolution notes must be at least 10 characters',
            'refund_amount.min' => 'Refund amount cannot be negative',
        ];
    }
}
