<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LocationManagementController extends Controller
{
    /**
     * Get all countries with their cities
     */
    public function index(): JsonResponse
    {
        $countries = Country::with('cities')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $countries,
        ]);
    }

    /**
     * Store a new country
     */
    public function storeCountry(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:countries,name',
            'code' => 'nullable|string|size:2|unique:countries,code',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $country = Country::create($validator->validated());

        return response()->json([
            'message' => 'Country created successfully',
            'data' => $country,
        ], 201);
    }

    /**
     * Update a country
     */
    public function updateCountry(Request $request, int $id): JsonResponse
    {
        $country = Country::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:countries,name,' . $id,
            'code' => 'nullable|string|size:2|unique:countries,code,' . $id,
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $country->update($validator->validated());

        return response()->json([
            'message' => 'Country updated successfully',
            'data' => $country,
        ]);
    }

    /**
     * Delete a country
     */
    public function deleteCountry(int $id): JsonResponse
    {
        $country = Country::findOrFail($id);
        $country->delete();

        return response()->json([
            'message' => 'Country deleted successfully',
        ]);
    }

    /**
     * Store a new city
     */
    public function storeCity(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if city already exists for this country
        $exists = City::where('country_id', $request->country_id)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'City already exists for this country',
            ], 422);
        }

        $city = City::create($validator->validated());
        $city->load('country');

        return response()->json([
            'message' => 'City created successfully',
            'data' => $city,
        ], 201);
    }

    /**
     * Update a city
     */
    public function updateCity(Request $request, int $id): JsonResponse
    {
        $city = City::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if city already exists for this country (excluding current city)
        $exists = City::where('country_id', $request->country_id)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'City already exists for this country',
            ], 422);
        }

        $city->update($validator->validated());
        $city->load('country');

        return response()->json([
            'message' => 'City updated successfully',
            'data' => $city,
        ]);
    }

    /**
     * Delete a city
     */
    public function deleteCity(int $id): JsonResponse
    {
        $city = City::findOrFail($id);
        $city->delete();

        return response()->json([
            'message' => 'City deleted successfully',
        ]);
    }

    /**
     * Get cities for a specific country
     */
    public function getCitiesByCountry(int $countryId): JsonResponse
    {
        $cities = City::where('country_id', $countryId)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $cities,
        ]);
    }
}
