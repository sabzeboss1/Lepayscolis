<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\Country;
use Illuminate\Http\JsonResponse;

class LocationController extends Controller
{
    /**
     * Get all active countries with their continent info
     */
    public function countries(): JsonResponse
    {
        $countries = Country::active()
            ->orderBy('name')
            ->get(['id', 'name', 'continent']);

        return response()->json([
            'data' => $countries,
        ]);
    }

    /**
     * Get cities for a specific country
     */
    public function cities(string $countryName): JsonResponse
    {
        $country = Country::where('name', $countryName)
            ->active()
            ->first();

        if (!$country) {
            return response()->json([
                'data' => [],
                'message' => 'Country not found',
            ], 404);
        }

        $cities = $country->cities()
            ->active()
            ->orderBy('name')
            ->pluck('name');

        return response()->json([
            'data' => $cities,
        ]);
    }
}
