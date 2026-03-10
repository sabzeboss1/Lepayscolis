<?php

namespace App\Http\Requests\KYC;

use Illuminate\Foundation\Http\FormRequest;

class RejectKYCRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * Only admin users can reject KYC documents.
     */
    public function authorize(): bool
    {
        // TODO: Implement admin role check when role system is in place
        // For now, return true and rely on route middleware for admin authorization
        // Example: return $this->user()->hasRole('admin');
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
            'rejection_reason' => [
                'required',
                'string',
                'min:10',
                'max:1000',
            ],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'rejection_reason.required' => 'A rejection reason is required.',
            'rejection_reason.string' => 'The rejection reason must be a valid text.',
            'rejection_reason.min' => 'The rejection reason must be at least 10 characters.',
            'rejection_reason.max' => 'The rejection reason must not exceed 1000 characters.',
        ];
    }
}
