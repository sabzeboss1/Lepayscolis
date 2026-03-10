<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendNotificationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:100'],
            'message' => ['required', 'string', 'max:500'],
            'recipient_type' => ['required', Rule::in(['individual', 'broadcast', 'group'])],
            'user_id' => ['required_if:recipient_type,individual', 'integer', 'exists:users,id'],
            'group_filter' => ['required_if:recipient_type,group', 'array'],
            'group_filter.kyc_status' => ['sometimes', Rule::in(['pending', 'approved', 'rejected'])],
            'group_filter.status' => ['sometimes', Rule::in(['active', 'suspended'])],
            'group_filter.last_login_days' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Title is required',
            'title.max' => 'Title must not exceed 100 characters',
            'message.required' => 'Message is required',
            'message.max' => 'Message must not exceed 500 characters',
            'recipient_type.required' => 'Recipient type is required',
            'recipient_type.in' => 'Recipient type must be individual, broadcast, or group',
            'user_id.required_if' => 'User ID is required for individual notifications',
            'user_id.exists' => 'Selected user does not exist',
            'group_filter.required_if' => 'Group filter is required for group notifications',
        ];
    }
}
