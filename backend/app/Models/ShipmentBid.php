<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ShipmentBid extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'shipment_request_id',
        'traveler_id',
        'proposed_price',
        'currency_code',
        'message',
        'trip_id',
        'proposed_pickup_date',
        'proposed_delivery_date',
        'status',
        'responded_at',
    ];

    protected $casts = [
        'proposed_price' => 'decimal:2',
        'proposed_pickup_date' => 'datetime',
        'proposed_delivery_date' => 'datetime',
        'responded_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
        });
    }

    // Relations
    public function shipmentRequest(): BelongsTo
    {
        return $this->belongsTo(ShipmentRequest::class);
    }

    public function traveler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traveler_id');
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeAccepted($query)
    {
        return $query->where('status', 'accepted');
    }

    // Helpers
    public function canBeAccepted(): bool
    {
        return $this->status === 'pending' && $this->shipmentRequest->canReceiveBids();
    }

    public function accept(): bool
    {
        if (!$this->canBeAccepted()) {
            return false;
        }

        \DB::transaction(function () {
            $this->update([
                'status' => 'accepted',
                'responded_at' => now(),
            ]);

            // Update the shipment request
            $this->shipmentRequest->update([
                'status' => 'assigned',
                'assigned_traveler_id' => $this->traveler_id,
                'agreed_price' => $this->proposed_price,
                'assigned_at' => now(),
            ]);

            // Reject all other bids
            $this->shipmentRequest->bids()
                ->where('id', '!=', $this->id)
                ->where('status', 'pending')
                ->update([
                    'status' => 'rejected',
                    'responded_at' => now(),
                ]);

            // Create a Shipment for tracking from the accepted ShipmentRequest
            $this->createShipmentFromRequest();
        });

        return true;
    }

    /**
     * Create a Shipment from the accepted ShipmentRequest for tracking purposes
     */
    private function createShipmentFromRequest(): void
    {
        $request = $this->shipmentRequest;
        
        // Get sender's wallet to hold funds
        $senderWallet = $request->sender->wallet;
        if (!$senderWallet) {
            throw new \Exception('Sender wallet not found');
        }

        // Check available balance
        $walletService = app(\App\Services\WalletService::class);
        $availableBalance = $walletService->getAvailableBalance($senderWallet);
        
        if ($availableBalance < $this->proposed_price) {
            throw new \Exception('Insufficient balance to create shipment');
        }

        // Create shipment from request data
        $shipment = \App\Models\Shipment::create([
            'sender_id' => $request->sender_id,
            'traveler_id' => $this->traveler_id,
            'trip_id' => $this->trip_id,
            'shipment_request_id' => $request->id,
            'title' => $request->title,
            'description' => $request->description,
            'package_description' => $request->description, // Map description to package_description
            'package_weight' => $request->weight,
            'package_length' => $request->length,
            'package_width' => $request->width,
            'package_height' => $request->height,
            'declared_value' => $request->declared_value,
            'package_type' => $request->package_type,
            'photo_urls' => $request->photo_urls,
            'recipient_name' => $request->recipient_name,
            'recipient_phone' => $request->recipient_phone,
            'pickup_country_id' => $request->pickup_country_id,
            'pickup_city_id' => $request->pickup_city_id,
            'pickup_address' => $request->pickup_address,
            'pickup_country' => $request->pickupCountry->name ?? '',
            'pickup_city' => $request->pickupCity->name ?? '',
            'delivery_country_id' => $request->delivery_country_id,
            'delivery_city_id' => $request->delivery_city_id,
            'delivery_address' => $request->delivery_address,
            'delivery_country' => $request->deliveryCountry->name ?? '',
            'delivery_city' => $request->deliveryCity->name ?? '',
            'currency_code' => $this->currency_code,
            'payment_amount' => $this->proposed_price,
            'status' => 'accepted', // Start as accepted since bid was accepted
            'payment_status' => 'escrowed',
            'pickup_date' => $this->proposed_pickup_date,
            'delivery_date' => $this->proposed_delivery_date,
        ]);

        // Hold funds in sender's wallet
        $walletService->hold(
            $senderWallet,
            $this->proposed_price,
            "Funds held for shipment #{$shipment->id} (from bid acceptance)",
            'shipment',
            $shipment->id
        );

        // Update trip capacity if trip is specified
        if ($this->trip_id) {
            $trip = $this->trip;
            $trip->available_capacity -= $request->weight;
            $trip->save();
        }
    }
}