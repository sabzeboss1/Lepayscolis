<?php

namespace App\Http\Requests\Rating;

use App\Models\Rating;
use App\Models\Shipment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitRatingRequest extends FormRequest
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
            'to_user_id' => ['required', 'exists:users,id'],
            'shipment_id' => ['required', 'uuid', 'exists:shipments,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validate shipment is delivered
            $shipment = Shipment::find($this->shipment_id);
            if ($shipment && $shipment->status !== 'delivered') {
                $validator->errors()->add('shipment_id', 'Shipment must be delivered before rating.');
            }

            // Validate user hasn't already rated this shipment
            $existingRating = Rating::where('from_user_id', $this->user()->id)
                ->where('to_user_id', $this->to_user_id)
                ->where('shipment_id', $this->shipment_id)
                ->first();

            if ($existingRating) {
                $validator->errors()->add('shipment_id', 'You have already rated this shipment.');
            }

            // Validate user is involved in the shipment
            if ($shipment) {
                $userId = (int) $this->user()->id;
                $senderId = (int) $shipment->sender_id;
                $travelerId = $shipment->traveler_id ? (int) $shipment->traveler_id : null;
                
                if ($senderId !== $userId && $travelerId !== $userId) {
                    $validator->errors()->add('shipment_id', 'You must be involved in this shipment to rate it.');
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'to_user_id.required' => 'The user to rate is required.',
            'to_user_id.exists' => 'The user to rate does not exist.',
            'shipment_id.required' => 'The shipment is required.',
            'shipment_id.exists' => 'The shipment does not exist.',
            'rating.required' => 'The rating is required.',
            'rating.integer' => 'The rating must be a number.',
            'rating.min' => 'The rating must be at least 1.',
            'rating.max' => 'The rating must not exceed 5.',
            'comment.max' => 'The comment must not exceed 500 characters.',
        ];
    }
}
