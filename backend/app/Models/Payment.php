<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'shipment_id',
        'payer_id',
        'payee_id',
        'amount',
        'platform_fee',
        'traveler_amount',
        'payment_method',
        'transaction_id',
        'currency_code',
        'status',
        'escrowed_at',
        'released_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'platform_fee' => 'decimal:2',
        'traveler_amount' => 'decimal:2',
        'status' => 'string',
        'escrowed_at' => 'datetime',
        'released_at' => 'datetime',
    ];

    /**
     * Get the shipment associated with the payment.
     */
    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }

    /**
     * Get the payer (sender) of the payment.
     */
    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_id');
    }

    /**
     * Get the payee (traveler) of the payment.
     */
    public function payee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payee_id');
    }
}
