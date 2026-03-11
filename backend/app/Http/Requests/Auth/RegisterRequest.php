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
            'email.required' => __('validation.auth.email_required'),
            'email.email' => __('validation.auth.email_email'),
            'email.unique' => __('validation.auth.email_unique'),
            'password.required' => __('validation.auth.password_required'),
            'password.min' => __('validation.auth.password_min'),
            'name.required' => __('validation.auth.name_required'),
            'phone.required' => __('validation.auth.phone_required'),
            'phone.unique' => __('validation.auth.phone_unique'),
            'phone.regex' => __('validation.auth.phone_regex'),
            'locale.required' => __('validation.auth.locale_required'),
            'locale.in' => __('validation.auth.locale_in'),
        ];
    }
}
