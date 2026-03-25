<?php

namespace App\Http\Controllers;

use App\Models\Country;
use Illuminate\Http\JsonResponse;

class CountryController extends Controller
{
    /**
     * GET /api/countries
     * List active countries with their active cities.
     */
    public function index(): JsonResponse
    {
        $countries = Country::active()
            ->with(['cities' => fn($q) => $q->active()->orderBy('name_en')])
            ->orderBy('name_en')
            ->get()
            ->map(fn($country) => [
                'id' => $country->id,
                'code' => $country->code,
                'name' => $country->name,
                'name_en' => $country->name_en,
                'name_fr' => $country->name_fr,
                'phone_code' => $country->phone_code,
                'default_currency_code' => $country->default_currency_code,
                'cities' => $country->cities->map(fn($city) => [
                    'id' => $city->id,
                    'name' => $city->name,
                    'name_en' => $city->name_en,
                    'name_fr' => $city->name_fr,
                ]),
            ]);

        return response()->json(['data' => $countries]);
    }

    /**
     * GET /api/countries/{id}/cities
     * List active cities for a country.
     */
    public function cities(int $id): JsonResponse
    {
        $country = Country::active()->findOrFail($id);

        $cities = $country->cities()
            ->active()
            ->orderBy('name_en')
            ->get()
            ->map(fn($city) => [
                'id' => $city->id,
                'name' => $city->name,
                'name_en' => $city->name_en,
                'name_fr' => $city->name_fr,
            ]);

        return response()->json(['data' => $cities]);
    }
}
