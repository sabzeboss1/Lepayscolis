<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shipment extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'sender_id',
        'traveler_id',
        'trip_id',
        'shipment_request_id',
        'title',
        'description',
        'package_description',
        'package_weight',
        'package_length',
        'package_width',
        'package_height',
        'declared_value',
        'package_type',
        'photo_urls',
        'recipient_name',
        'recipient_phone',
        'pickup_city',
        'pickup_country',
        'pickup_country_id',
        'pickup_city_id',
        'pickup_address',
        'delivery_city',
        'delivery_country',
        'delivery_country_id',
        'delivery_city_id',
        'delivery_address',
        'status',
        'payment_amount',
        'payment_status',
        'currency_code',
        'pickup_date',
        'delivery_date',
    ];

    protected $casts = [
        'package_weight' => 'decimal:2',
        'payment_amount' => 'decimal:2',
        'declared_value' => 'decimal:2',
        'package_length' => 'integer',
        'package_width' => 'integer',
        'package_height' => 'integer',
        'photo_urls' => 'array',
        'pickup_date' => 'datetime',
        'delivery_date' => 'datetime',
        'status' => 'string',
        'payment_status' => 'string',
    ];

    /**
     * Get the sender of the shipment.
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get the traveler of the shipment.
     */
    public function traveler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traveler_id');
    }

    /**
     * Get the trip associated with the shipment.
     */
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    /**
     * Get the shipment request that created this shipment.
     */
    public function shipmentRequest(): BelongsTo
    {
        return $this->belongsTo(ShipmentRequest::class);
    }

    public function pickupCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'pickup_country_id');
    }

    public function pickupCity(): BelongsTo
    {
        return $this->belongsTo(City::class, 'pickup_city_id');
    }

    public function deliveryCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'delivery_country_id');
    }

    public function deliveryCity(): BelongsTo
    {
        return $this->belongsTo(City::class, 'delivery_city_id');
    }

    /**
     * Get the ratings for the shipment.
     */
    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }

    /**
     * Get the payment for the shipment.
     */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    /**
     * Check if the shipment can transition to a new status.
     */
    public function canTransitionTo(string $newStatus): bool
    {
        $allowedTransitions = [
            'pending' => ['accepted', 'cancelled'],
            'accepted' => ['in_transit', 'cancelled'],
            'in_transit' => ['delivered', 'cancelled'],
            'delivered' => [],
            'cancelled' => [],
        ];

        // Prevent cancellation if payment is already released
        if ($newStatus === 'cancelled' && $this->payment_status === 'released') {
            return false;
        }

        return in_array($newStatus, $allowedTransitions[$this->status] ?? []);
    }

    /**
     * Accept the shipment by a traveler.
     */
    public function accept(User $traveler, Trip $trip): void
    {
        $this->traveler_id = $traveler->id;
        $this->trip_id = $trip->id;
        $this->status = 'accepted';
        $this->save();
    }

    /**
     * Confirm delivery of the shipment.
     */
    public function confirmDelivery(): void
    {
        $this->status = 'delivered';
        $this->save();
    }
}
