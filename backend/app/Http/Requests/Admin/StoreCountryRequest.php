<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'size:2', 'regex:/^[A-Z]{2}$/', 'unique:countries,code'],
            'name_en' => ['required', 'string', 'max:255'],
            'name_fr' => ['required', 'string', 'max:255'],
            'phone_code' => ['required', 'string', 'max:10', 'regex:/^\+\d{1,4}$/'],
            'default_currency_code' => ['nullable', 'string', 'size:3', 'exists:currencies,code'],
            'default_locale' => ['required', 'string', 'in:fr,en'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
