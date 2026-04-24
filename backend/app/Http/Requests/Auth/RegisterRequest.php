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
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Normalize phone number to E.164 format
        if ($this->has('phone')) {
            $this->merge([
                'phone' => $this->normalizePhoneNumber($this->phone, $this->country),
            ]);
        }

        // Normalize email to lowercase
        if ($this->has('email')) {
            $this->merge([
                'email' => strtolower(trim($this->email)),
            ]);
        }
    }

    /**
     * Normalize phone number to E.164 format
     *
     * @param string $phone
     * @param string|null $countryCode
     * @return string
     */
    private function normalizePhoneNumber(string $phone, ?string $countryCode = null): string
    {
        // Remove all non-digit characters except leading +
        $hasPlus = str_starts_with(trim($phone), '+');
        $digits = preg_replace('/\D/', '', $phone);
        
        // If already has + and looks like E.164, return it
        if ($hasPlus && strlen($digits) >= 7 && strlen($digits) <= 15) {
            return '+' . $digits;
        }

        // Country-specific normalization
        $countryPrefixes = [
            'FR' => '+33',
            'CI' => '+225',
            'SN' => '+221',
            'ML' => '+223',
            'BF' => '+226',
            'BJ' => '+229',
            'TG' => '+228',
            'NE' => '+227',
            'GN' => '+224',
            'CM' => '+237',
            'RU' => '+7',
        ];

        if ($countryCode && isset($countryPrefixes[strtoupper($countryCode)])) {
            $prefix = $countryPrefixes[strtoupper($countryCode)];
            
            // Remove leading 0 if present (common in local formats)
            if (str_starts_with($digits, '0')) {
                $digits = substr($digits, 1);
            }
            
            // If doesn't start with country code, add it
            if (!str_starts_with($digits, ltrim($prefix, '+'))) {
                return $prefix . $digits;
            }
            
            return '+' . $digits;
        }

        // Fallback: just ensure it has + prefix
        return $hasPlus ? '+' . $digits : $phone;
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
            'country' => [
                'required',
                'string',
                'exists:countries,code',
            ],
            'locale' => [
                'sometimes',
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
            'country.required' => __('validation.auth.country_required'),
            'country.exists' => __('validation.auth.country_exists'),
            'locale.in' => __('validation.auth.locale_in'),
        ];
    }
}
