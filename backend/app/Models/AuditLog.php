<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    const UPDATED_AT = null; // No updated_at column

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'admin_id',
        'action',
        'resource_type',
        'resource_id',
        'ip_address',
        'before',
        'after',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'before' => 'array',
        'after' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Get the admin user who performed the action.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Static helper to create an audit log entry.
     *
     * @param User $admin
     * @param string $action
     * @param string $resourceType
     * @param string|int $resourceId
     * @param array|null $before
     * @param array|null $after
     * @return self
     */
    public static function log(
        User $admin,
        string $action,
        string $resourceType,
        string|int $resourceId,
        ?array $before = null,
        ?array $after = null
    ): self {
        return self::create([
            'admin_id' => $admin->id,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'ip_address' => request()->ip(),
            'before' => $before,
            'after' => $after,
        ]);
    }
}
