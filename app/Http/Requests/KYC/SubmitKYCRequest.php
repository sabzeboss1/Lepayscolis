<?php

namespace App\Http\Requests\KYC;

use Illuminate\Foundation\Http\FormRequest;

class SubmitKYCRequest extends FormRequest
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
            'document_type' => [
                'required',
                'string',
                'in:passport,idCard,driversLicense',
            ],
            'document_front' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:5120', // 5MB in kilobytes
            ],
            'document_back' => [
                'required_if:document_type,idCard',
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:5120', // 5MB in kilobytes
            ],
            'selfie' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:5120', // 5MB in kilobytes
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
            'document_type.required' => 'The document type is required.',
            'document_type.in' => 'The document type must be one of: passport, idCard, driversLicense.',
            'document_front.required' => 'The front of the document is required.',
            'document_front.file' => 'The document front must be a valid file.',
            'document_front.mimes' => 'The document front must be a file of type: jpg, jpeg, png, pdf.',
            'document_front.max' => 'The document front must not exceed 5MB.',
            'document_back.required' => 'The back of the document is required for ID cards.',
            'document_back.file' => 'The document back must be a valid file.',
            'document_back.mimes' => 'The document back must be a file of type: jpg, jpeg, png, pdf.',
            'document_back.max' => 'The document back must not exceed 5MB.',
            'selfie.required' => 'A selfie is required.',
            'selfie.file' => 'The selfie must be a valid file.',
            'selfie.mimes' => 'The selfie must be a file of type: jpg, jpeg, png, pdf.',
            'selfie.max' => 'The selfie must not exceed 5MB.',
        ];
    }
}
