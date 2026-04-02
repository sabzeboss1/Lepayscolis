<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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

        return true;
    }
}