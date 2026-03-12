<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Currency extends Model
{
    /**
     * Cache TTL for currency data (1 hour).
     */
    private const CACHE_TTL = 3600;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'code',
        'symbol',
        'name',
        'exchange_rate',
        'is_active',
        'is_base',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'exchange_rate' => 'decimal:6',
            'is_active' => 'boolean',
            'is_base' => 'boolean',
        ];
    }

    /**
     * Scope a query to only include active currencies.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the base currency (cached).
     */
    public static function base(): ?self
    {
        return Cache::remember('currency_base', self::CACHE_TTL, function () {
            return static::where('is_base', true)->first();
        });
    }

    /**
     * Find a currency by its ISO 4217 code (cached).
     */
    public static function findByCode(string $code): ?self
    {
        return Cache::remember("currency_{$code}", self::CACHE_TTL, function () use ($code) {
            return static::where('code', $code)->first();
        });
    }

    /**
     * Clear all currency-related caches.
     */
    public static function clearCache(): void
    {
        Cache::forget('currency_base');
        Cache::forget('currencies_active');

        $currencies = static::all();
        foreach ($currencies as $currency) {
            Cache::forget("currency_{$currency->code}");
        }
    }
}
