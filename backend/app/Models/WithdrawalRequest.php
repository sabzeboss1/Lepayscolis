<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class WithdrawalRequest extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',
        'amount',
        'fee',
        'net_amount',
        'country_code',
        'currency',
        'payment_method',
        'payment_details',
        'status',
        'rejection_reason',
        'approved_by',
        'approved_at',
        'completed_at',
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
            'fee' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'payment_details' => 'array',
            'approved_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the withdrawal request.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin user who approved the withdrawal.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the wallet transaction associated with this withdrawal.
     */
    public function walletTransaction(): HasOne
    {
        return $this->hasOne(WalletTransaction::class, 'reference_id', 'id')
            ->where('reference_type', 'withdrawal');
    }
}
