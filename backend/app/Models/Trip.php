<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Trip extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'traveler_id',
        'departure_city',
        'departure_country',
        'departure_country_id',
        'departure_city_id',
        'departure_date',
        'arrival_city',
        'arrival_country',
        'arrival_country_id',
        'arrival_city_id',
        'arrival_date',
        'available_capacity',
        'price_per_kg',
        'accepted_package_types',
        'pickup_address',
        'delivery_address',
        'currency_code',
        'status',
        'travel_proof_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'departure_date' => 'date',
            'arrival_date' => 'date',
            'available_capacity' => 'decimal:2',
            'price_per_kg' => 'decimal:2',
            'accepted_package_types' => 'array',
            'currency_code' => 'string',
            'status' => 'string',
        ];
    }

    /**
     * Get the traveler that owns the trip.
     */
    public function traveler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traveler_id');
    }

    /**
     * Get the currency of the trip's price.
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_code', 'code');
    }

    public function departureCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'departure_country_id');
    }

    public function departureCity(): BelongsTo
    {
        return $this->belongsTo(City::class, 'departure_city_id');
    }

    public function arrivalCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'arrival_country_id');
    }

    public function arrivalCity(): BelongsTo
    {
        return $this->belongsTo(City::class, 'arrival_city_id');
    }

    /**
     * Get the shipments for the trip.
     */
    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    /**
     * Get the accepted (non-cancelled, non-pending) shipments for this trip.
     */
    public function acceptedShipments()
    {
        return $this->shipments()->whereIn('status', ['accepted', 'in_transit', 'delivered']);
    }

    /**
     * Get the remaining capacity for this trip.
     */
    public function remainingCapacity(): float
    {
        return (float) $this->available_capacity;
    }

    /**
     * Get the total weight of accepted shipments.
     */
    public function acceptedShipmentsWeight(): float
    {
        return (float) $this->acceptedShipments()->sum('package_weight');
    }

    /**
     * Get the count of accepted shipments.
     */
    public function acceptedShipmentsCount(): int
    {
        return $this->acceptedShipments()->count();
    }

    /**
     * Check if the trip has capacity for the given weight.
     */
    public function hasCapacityFor(float $weight): bool
    {
        return $this->remainingCapacity() >= $weight;
    }

    /**
     * Scope a query to only include active trips.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include upcoming trips.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('departure_date', '>', now());
    }

    /**
     * Scope a query to filter trips by route.
     */
    public function scopeByRoute($query, $departure = null, $arrival = null, $departureCountryId = null, $departureCityId = null, $arrivalCountryId = null, $arrivalCityId = null)
    {
        if ($departureCountryId) {
            $query->where('departure_country_id', $departureCountryId);
        }
        if ($departureCityId) {
            $query->where('departure_city_id', $departureCityId);
        }
        if ($arrivalCountryId) {
            $query->where('arrival_country_id', $arrivalCountryId);
        }
        if ($arrivalCityId) {
            $query->where('arrival_city_id', $arrivalCityId);
        }
        if ($departure) {
            $query->where('departure_city', 'like', "%{$departure}%");
        }
        if ($arrival) {
            $query->where('arrival_city', 'like', "%{$arrival}%");
        }

        return $query;
    }
}
