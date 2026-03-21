<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class PlatformSetting extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
        'updated_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Cache TTL in seconds (1 hour).
     */
    const CACHE_TTL = 3600;

    /**
     * Get the user who last updated this setting.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get a setting value by key with caching.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get(string $key, $default = null)
    {
        return Cache::remember("platform_setting:{$key}", self::CACHE_TTL, function () use ($key, $default) {
            $setting = self::where('key', $key)->first();
            
            if (!$setting) {
                return $default;
            }

            return self::castValue($setting->value, $setting->type);
        });
    }

    /**
     * Set a setting value by key.
     *
     * @param string $key
     * @param mixed $value
     * @param int|null $updatedBy
     * @return void
     */
    public static function set(string $key, $value, ?int $updatedBy = null): void
    {
        $setting = self::where('key', $key)->first();
        
        if ($setting) {
            $type = $setting->type;
        } else {
            $type = self::inferType($value);
        }

        self::updateOrCreate(
            ['key' => $key],
            [
                'value' => (string) $value,
                'type' => $type,
                'updated_by' => $updatedBy,
            ]
        );

        // Clear cache
        Cache::forget("platform_setting:{$key}");
    }

    /**
     * Cast value based on type.
     *
     * @param string $value
     * @param string $type
     * @return mixed
     */
    public static function castValue(string $value, string $type)
    {
        return match ($type) {
            'integer' => (int) $value,
            'float' => (float) $value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Infer type from value.
     *
     * @param mixed $value
     * @return string
     */
    protected static function inferType($value): string
    {
        if (is_int($value)) {
            return 'integer';
        }
        if (is_float($value)) {
            return 'float';
        }
        if (is_bool($value)) {
            return 'boolean';
        }
        if (is_array($value)) {
            return 'json';
        }
        return 'string';
    }

    /**
     * Get the sender fee percentage.
     */
    public static function getSenderFeePercentage(): float
    {
        return (float) self::get('sender_fee_percentage', 1.0);
    }

    /**
     * Get the traveler fee percentage.
     */
    public static function getTravelerFeePercentage(): float
    {
        return (float) self::get('traveler_fee_percentage', 2.0);
    }

    /**
     * Calculate fees for a given base amount.
     *
     * @return array{sender_fee: float, traveler_fee: float, total_sender_pays: float, traveler_receives: float, platform_revenue: float}
     */
    public static function calculateFees(float $baseAmount): array
    {
        $senderFeePercent = self::getSenderFeePercentage();
        $travelerFeePercent = self::getTravelerFeePercentage();

        $senderFee = round($baseAmount * ($senderFeePercent / 100), 2);
        $travelerFee = round($baseAmount * ($travelerFeePercent / 100), 2);

        return [
            'base_amount' => $baseAmount,
            'sender_fee_percentage' => $senderFeePercent,
            'traveler_fee_percentage' => $travelerFeePercent,
            'sender_fee' => $senderFee,
            'traveler_fee' => $travelerFee,
            'total_sender_pays' => round($baseAmount + $senderFee, 2),
            'traveler_receives' => round($baseAmount - $travelerFee, 2),
            'platform_revenue' => round($senderFee + $travelerFee, 2),
        ];
    }
}
