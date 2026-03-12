<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar',
        'rating',
        'completed_deliveries',
        'is_recommended',
        'kyc_status',
        'locale',
        'currency_code',
        'fcm_token',
        'role',
        'messaging_banned',
        'messaging_ban_reason',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'rating' => 'decimal:2',
            'completed_deliveries' => 'integer',
            'is_recommended' => 'boolean',
            'kyc_status' => 'string',
            'locale' => 'string',
            'currency_code' => 'string',
            'messaging_banned' => 'boolean',
        ];
    }

    /**
     * Get the trips published by the user as a traveler.
     */
    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'traveler_id');
    }

    /**
     * Get the shipments created by the user as a sender.
     */
    public function shipmentsAsSender(): HasMany
    {
        return $this->hasMany(Shipment::class, 'sender_id');
    }

    /**
     * Get the shipments accepted by the user as a traveler.
     */
    public function shipmentsAsTraveler(): HasMany
    {
        return $this->hasMany(Shipment::class, 'traveler_id');
    }

    /**
     * Get all ratings received by the user.
     */
    public function ratingsReceived(): HasMany
    {
        return $this->hasMany(Rating::class, 'to_user_id');
    }

    /**
     * Get all ratings given by the user.
     */
    public function ratingsGiven(): HasMany
    {
        return $this->hasMany(Rating::class, 'from_user_id');
    }

    /**
     * Get the user's KYC documents.
     */
    public function kycDocuments(): HasMany
    {
        return $this->hasMany(KYCDocument::class);
    }

    /**
     * Check if the user can publish a trip.
     * Requires KYC status to be approved.
     */
    public function canPublishTrip(): bool
    {
        return $this->kyc_status === 'approved';
    }

    /**
     * Check if the user can create a shipment.
     * Requires KYC status to be approved.
     */
    public function canCreateShipment(): bool
    {
        return $this->kyc_status === 'approved';
    }

    /**
     * Update the user's average rating based on all received ratings.
     */
    public function updateRating(): void
    {
        $averageRating = $this->ratingsReceived()->avg('rating');
        
        if ($averageRating !== null) {
            $this->rating = round($averageRating, 2);
            $this->save();
        }
    }

    /**
     * Update the user's recommended status.
     * User is recommended if rating >= 4.5 AND completed_deliveries >= 5.
     */
    public function updateRecommendedStatus(): void
    {
        $this->is_recommended = $this->rating >= 4.5 && $this->completed_deliveries >= 5;
        $this->save();
    }

    /**
     * Get audit logs created by this admin user.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'admin_id');
    }

    /**
     * Get admin sessions for this user.
     */
    public function adminSessions(): HasMany
    {
        return $this->hasMany(AdminSession::class, 'admin_id');
    }

    /**
     * Get notifications sent by this admin user.
     */
    public function adminNotifications(): HasMany
    {
        return $this->hasMany(AdminNotification::class, 'sent_by');
    }

    /**
     * Check if the user is an admin (admin or super_admin).
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin']);
    }

    /**
     * Check if the user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Get the user's preferred currency.
     */
    public function preferredCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_code', 'code');
    }

    /**
     * Get the user's wallet.
     */
    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    /**
     * Get all wallet transactions for the user through their wallet.
     */
    public function walletTransactions(): HasManyThrough
    {
        return $this->hasManyThrough(WalletTransaction::class, Wallet::class);
    }

    /**
     * Get all withdrawal requests for the user.
     */
    public function withdrawalRequests(): HasMany
    {
        return $this->hasMany(WithdrawalRequest::class);
    }
}
