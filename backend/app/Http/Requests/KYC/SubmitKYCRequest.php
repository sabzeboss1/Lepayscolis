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
                'max:' . env('UPLOAD_MAX_FILESIZE', 25600), // Default 25MB
            ],
            'document_back' => [
                'required_if:document_type,idCard',
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:' . env('UPLOAD_MAX_FILESIZE', 25600), // Default 25MB
            ],
            'selfie' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:' . env('UPLOAD_MAX_FILESIZE', 25600), // Default 25MB
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
            'document_type.required' => __('validation.kyc.document_type_required'),
            'document_type.in' => __('validation.kyc.document_type_in'),
            'document_front.required' => __('validation.kyc.document_front_required'),
            'document_front.file' => __('validation.kyc.document_front_file'),
            'document_front.mimes' => __('validation.kyc.document_front_mimes'),
            'document_front.max' => __('validation.kyc.document_front_max'),
            'document_back.required' => __('validation.kyc.document_back_required'),
            'document_back.file' => __('validation.kyc.document_back_file'),
            'document_back.mimes' => __('validation.kyc.document_back_mimes'),
            'document_back.max' => __('validation.kyc.document_back_max'),
            'selfie.required' => __('validation.kyc.selfie_required'),
            'selfie.file' => __('validation.kyc.selfie_file'),
            'selfie.mimes' => __('validation.kyc.selfie_mimes'),
            'selfie.max' => __('validation.kyc.selfie_max'),
        ];
    }
}
