<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\CurrencyService;

/**
 * ShipmentRequestResource - Transform shipment request model to JSON
 * 
 * Includes:
 * - All shipment request fields
 * - Sender data using PublicUserResource (whenLoaded)
 * - Currency conversion for max_budget
 * - Dates formatted as ISO 8601
 */
class ShipmentRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $currencyService = app(CurrencyService::class);
        
        // Get original currency from shipment request
        $originalCurrency = $this->currency_code ?? 'XAF';
        $originalAmount = $this->max_budget;
        
        // Convert currency if user is authenticated and has different preferred currency
        $convertedAmount = null;
        $convertedCurrency = null;
        $formattedAmount = null;
        
        if ($user && $user->preferred_currency && $user->preferred_currency !== $originalCurrency && $originalAmount > 0) {
            try {
                $convertedAmount = $currencyService->convert($originalAmount, $originalCurrency, $user->preferred_currency);
                $convertedCurrency = $user->preferred_currency;
                $formattedAmount = $currencyService->format($convertedAmount, $convertedCurrency);
            } catch (\Exception $e) {
                // Fallback to original currency if conversion fails
                $convertedAmount = null;
                $convertedCurrency = null;
                $formattedAmount = null;
            }
        }

        return [
            'id' => $this->id,
            'sender_id' => $this->sender_id,
            'title' => $this->title,
            'description' => $this->description,
            'weight' => $this->weight,
            'length' => $this->length,
            'width' => $this->width,
            'height' => $this->height,
            'declared_value' => $this->declared_value,
            'package_type' => $this->package_type,
            'recipient_name' => $this->recipient_name,
            'recipient_phone' => $this->recipient_phone,
            'pickup_country_id' => $this->pickup_country_id,
            'pickup_city_id' => $this->pickup_city_id,
            'pickup_address' => $this->pickup_address,
            'delivery_country_id' => $this->delivery_country_id,
            'delivery_city_id' => $this->delivery_city_id,
            'delivery_address' => $this->delivery_address,
            'max_budget' => $this->max_budget,
            'currency_code' => $originalCurrency,
            
            // Currency conversion fields
            'max_budget_converted' => $convertedAmount,
            'max_budget_formatted' => $formattedAmount,
            'max_budget_original' => $originalAmount,
            'max_budget_original_currency' => $originalCurrency,
            
            'needed_by' => $this->needed_by,
            'status' => $this->status,
            'verification_status' => $this->verification_status,
            'photo_urls' => $this->photo_urls,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Include relationships when loaded
            'sender' => $this->whenLoaded('sender', fn() => PublicUserResource::make($this->sender)->resolve()),
            'pickup_country' => $this->whenLoaded('pickupCountry'),
            'pickup_city' => $this->whenLoaded('pickupCity'),
            'delivery_country' => $this->whenLoaded('deliveryCountry'),
            'delivery_city' => $this->whenLoaded('deliveryCity'),
            'bids' => $this->whenLoaded('bids', function() {
                return $this->bids->map(function($bid) {
                    return [
                        'id' => $bid->id,
                        'proposed_price' => $bid->proposed_price,
                        'currency_code' => $bid->currency_code,
                        'message' => $bid->message,
                        'proposed_pickup_date' => $bid->proposed_pickup_date?->toISOString(),
                        'proposed_delivery_date' => $bid->proposed_delivery_date?->toISOString(),
                        'status' => $bid->status,
                        'created_at' => $bid->created_at?->toISOString(),
                        'traveler' => $bid->traveler ? [
                            'id' => $bid->traveler->id,
                            'name' => $bid->traveler->name,
                            'avatar' => $bid->traveler->avatar,
                            'rating' => $bid->traveler->rating ?? 0,
                            'completed_deliveries' => $bid->traveler->completed_deliveries ?? 0,
                        ] : null,
                    ];
                });
            }),
            'bids_count' => $this->when(isset($this->bids_count), $this->bids_count),
        ];
    }
}