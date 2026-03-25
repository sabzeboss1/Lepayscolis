<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BulkTripVerificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string', 'exists:trips,id'],
            'reason' => ['sometimes', 'string', 'min:10', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'At least one trip ID is required',
            'ids.array' => 'IDs must be an array',
            'ids.*.exists' => 'One or more trip IDs do not exist',
            'reason.min' => 'Reason must be at least 10 characters',
        ];
    }
}
