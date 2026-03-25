<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class City extends Model
{
    protected $fillable = [
        'name_en',
        'name_fr',
        'country_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // --- Relationships ---

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    // --- Scopes ---

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForCountry($query, int $countryId)
    {
        return $query->where('country_id', $countryId);
    }

    // --- Accessor ---

    public function getNameAttribute(): string
    {
        $locale = app()->getLocale();
        return $locale === 'fr' ? $this->name_fr : $this->name_en;
    }
}
