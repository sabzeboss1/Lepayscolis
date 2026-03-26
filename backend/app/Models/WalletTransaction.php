<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WalletTransaction extends Model
{
    use HasFactory;

    /**
     * Indicates if the model should be timestamped.
     * We only use created_at, not updated_at (immutable records).
     *
     * @var bool
     */
    public $timestamps = true;

    /**
     * The name of the "updated at" column.
     * Set to null to disable updated_at.
     *
     * @var string|null
     */
    const UPDATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'wallet_id',
        'type',
        'amount',
        'description',
        'reference_type',
        'reference_id',
        'balance_after',
        'currency_code',
        'original_amount',
        'original_currency_code',
        'exchange_rate_used',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'original_amount' => 'decimal:2',
            'exchange_rate_used' => 'decimal:6',
        ];
    }

    /**
     * Get the wallet that owns the transaction.
     */
    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    /**
     * Get the parent reference model (shipment, withdrawal, etc.).
     */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
