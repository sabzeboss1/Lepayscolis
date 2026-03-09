<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WalletAuditLog extends Model
{
    use HasFactory, HasUuids;

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
        'admin_id',
        'action',
        'target_type',
        'target_id',
        'reason',
        'metadata',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    /**
     * Get the admin user who performed the action.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Get the parent target model (wallet, withdrawal, etc.).
     */
    public function target(): MorphTo
    {
        return $this->morphTo();
    }
}
