<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCityRequest;
use App\Http\Requests\Admin\UpdateCityRequest;
use App\Models\City;
use App\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminCityController extends Controller
{
    /**
     * GET /api/admin/cities
     */
    public function index(Request $request): JsonResponse
    {
        $query = City::with('country');

        if ($request->filled('country_id')) {
            $query->where('country_id', $request->country_id);
        }

        $cities = $query->orderBy('name_en')->get();

        return response()->json([
            'data' => $cities,
            'meta' => [
                'total' => $cities->count(),
                'active' => $cities->where('is_active', true)->count(),
            ],
        ]);
    }

    /**
     * POST /api/admin/cities
     */
    public function store(StoreCityRequest $request): JsonResponse
    {
        $city = City::create($request->validated());
        Country::clearCache();

        Log::info('City created by admin', [
            'city' => $city->name_en,
            'country_id' => $city->country_id,
            'admin_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => __('messages.city.created'),
            'data' => $city->load('country'),
        ], 201);
    }

    /**
     * PUT /api/admin/cities/{id}
     */
    public function update(UpdateCityRequest $request, int $id): JsonResponse
    {
        $city = City::findOrFail($id);
        $city->update($request->validated());
        Country::clearCache();

        Log::info('City updated by admin', [
            'city' => $city->name_en,
            'admin_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => __('messages.city.updated'),
            'data' => $city->fresh()->load('country'),
        ]);
    }

    /**
     * POST /api/admin/cities/{id}/toggle
     */
    public function toggle(int $id): JsonResponse
    {
        $city = City::findOrFail($id);
        $city->update(['is_active' => !$city->is_active]);
        Country::clearCache();

        Log::info('City toggled by admin', [
            'city' => $city->name_en,
            'is_active' => $city->is_active,
            'admin_id' => request()->user()->id,
        ]);

        return response()->json([
            'message' => $city->is_active
                ? __('messages.city.activated')
                : __('messages.city.deactivated'),
            'data' => $city,
        ]);
    }

    /**
     * DELETE /api/admin/cities/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $city = City::findOrFail($id);

        $usageCount = DB::table('trips')
                ->where('departure_city_id', $id)
                ->orWhere('arrival_city_id', $id)
                ->count()
            + DB::table('shipments')
                ->where('pickup_city_id', $id)
                ->orWhere('delivery_city_id', $id)
                ->count();

        if ($usageCount > 0) {
            return response()->json([
                'message' => __('messages.city.in_use', ['count' => $usageCount]),
            ], 422);
        }

        $city->delete();
        Country::clearCache();

        Log::info('City deleted by admin', [
            'city' => $city->name_en,
            'admin_id' => request()->user()->id,
        ]);

        return response()->json([
            'message' => __('messages.city.deleted'),
        ]);
    }
}
