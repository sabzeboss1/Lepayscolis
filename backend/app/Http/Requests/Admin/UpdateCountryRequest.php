<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $countryId = $this->route('id');

        return [
            'code' => ['sometimes', 'string', 'size:2', 'regex:/^[A-Z]{2}$/', 'unique:countries,code,' . $countryId],
            'name_en' => ['sometimes', 'string', 'max:255'],
            'name_fr' => ['sometimes', 'string', 'max:255'],
            'phone_code' => ['sometimes', 'string', 'max:10', 'regex:/^\+\d{1,4}$/'],
            'default_currency_code' => ['nullable', 'string', 'size:3', 'exists:currencies,code'],
            'default_locale' => ['sometimes', 'string', 'in:fr,en'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
