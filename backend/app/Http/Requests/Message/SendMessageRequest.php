<?php

namespace App\Http\Requests\Message;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendMessageRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'recipient_id' => [
                'required',
                'integer',
                'exists:users,id',
                Rule::notIn([$this->user()->id]), // Cannot send message to self
            ],
            'content' => [
                'required',
                'string',
                'max:1000',
            ],
            'conversation_id' => [
                'nullable',
                'string',
                'exists:conversations,id',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'recipient_id.not_in' => __('validation.message.recipient_not_self'),
            'content.max' => __('validation.message.content_max'),
        ];
    }
}
