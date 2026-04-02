<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ShipmentRequest extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'sender_id',
        'title',
        'description',
        'weight',
        'length',
        'width',
        'height',
        'declared_value',
        'package_type',
        'photo_urls',
        'recipient_name',
        'recipient_phone',
        'pickup_country_id',
        'pickup_city_id',
        'pickup_address',
        'delivery_country_id',
        'delivery_city_id',
        'delivery_address',
        'max_budget',
        'currency_code',
        'status',
        'verification_status',
        'rejection_reason',
        'assigned_traveler_id',
        'agreed_price',
        'needed_by',
        'assigned_at',
        'completed_at',
    ];

    protected $casts = [
        'photo_urls' => 'array',
        'weight' => 'decimal:2',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'declared_value' => 'decimal:2',
        'max_budget' => 'decimal:2',
        'agreed_price' => 'decimal:2',
        'needed_by' => 'datetime',
        'assigned_at' => 'datetime',
        'completed_at' => 'datetime',
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
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function assignedTraveler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_traveler_id');
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

    public function bids(): HasMany
    {
        return $this->hasMany(ShipmentBid::class);
    }

    public function pendingBids(): HasMany
    {
        return $this->hasMany(ShipmentBid::class)->where('status', 'pending');
    }

    public function acceptedBid(): HasMany
    {
        return $this->hasMany(ShipmentBid::class)->where('status', 'accepted');
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    public function scopeForRoute($query, $pickupCountryId, $deliveryCountryId)
    {
        return $query->where('pickup_country_id', $pickupCountryId)
                    ->where('delivery_country_id', $deliveryCountryId);
    }

    // Helpers
    public function canReceiveBids(): bool
    {
        return $this->status === 'open' && $this->verification_status === 'verified';
    }

    public function getTotalVolume(): float
    {
        return $this->length * $this->width * $this->height;
    }
}