<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
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
            'email' => [
                'required',
                'email:rfc',
                'unique:users,email',
                'max:255',
            ],
            'password' => [
                'required',
                'string',
                'min:8',
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'phone' => [
                'required',
                'string',
                'unique:users,phone',
                'regex:/^\+[1-9]\d{1,14}$/', // E.164 international format
            ],
            'locale' => [
                'required',
                'string',
                'in:fr,en',
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
            'email.required' => 'The email address is required.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already registered.',
            'password.required' => 'The password is required.',
            'password.min' => 'The password must be at least 8 characters.',
            'name.required' => 'The name is required.',
            'phone.required' => 'The phone number is required.',
            'phone.unique' => 'This phone number is already registered.',
            'phone.regex' => 'The phone number must be in international format (e.g., +33612345678).',
            'locale.required' => 'The locale is required.',
            'locale.in' => 'The locale must be either fr or en.',
        ];
    }
}
