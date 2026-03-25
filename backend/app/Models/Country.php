<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Country extends Model
{
    private const CACHE_TTL = 3600;

    protected $fillable = [
        'code',
        'name_en',
        'name_fr',
        'phone_code',
        'default_currency_code',
        'default_locale',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // --- Relationships ---

    public function cities(): HasMany
    {
        return $this->hasMany(City::class);
    }

    public function defaultCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'default_currency_code', 'code');
    }

    // --- Scopes ---

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // --- Static Cached Helpers ---

    public static function findByCode(string $code): ?self
    {
        return Cache::remember("country_{$code}", self::CACHE_TTL, function () use ($code) {
            return static::where('code', $code)->first();
        });
    }

    public static function allActive(): \Illuminate\Support\Collection
    {
        return Cache::remember('countries_active', self::CACHE_TTL, function () {
            return static::active()->orderBy('name_en')->get();
        });
    }

    public static function clearCache(): void
    {
        Cache::forget('countries_active');
        $countries = static::all();
        foreach ($countries as $country) {
            Cache::forget("country_{$country->code}");
        }
    }

    // --- Accessor ---

    public function getNameAttribute(): string
    {
        $locale = app()->getLocale();
        return $locale === 'fr' ? $this->name_fr : $this->name_en;
    }
}
