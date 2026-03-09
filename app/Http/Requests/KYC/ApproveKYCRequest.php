<?php

namespace App\Http\Requests\KYC;

use Illuminate\Foundation\Http\FormRequest;

class ApproveKYCRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * Only admin users can approve KYC documents.
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
        // No additional validation needed for approval
        // The KYC document ID comes from the route parameter
        return [];
    }
}
