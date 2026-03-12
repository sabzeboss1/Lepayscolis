<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCountryRequest;
use App\Http\Requests\Admin\UpdateCountryRequest;
use App\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminCountryController extends Controller
{
    /**
     * GET /api/admin/countries
     */
    public function index(): JsonResponse
    {
        $countries = Country::with(['cities', 'defaultCurrency'])
            ->orderBy('name_en')
            ->get();

        return response()->json([
            'data' => $countries,
            'meta' => [
                'total' => $countries->count(),
                'active' => $countries->where('is_active', true)->count(),
            ],
        ]);
    }

    /**
     * POST /api/admin/countries
     */
    public function store(StoreCountryRequest $request): JsonResponse
    {
        $country = Country::create($request->validated());
        Country::clearCache();

        Log::info('Country created by admin', [
            'code' => $country->code,
            'admin_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => __('messages.country.created'),
            'data' => $country->load('cities'),
        ], 201);
    }

    /**
     * PUT /api/admin/countries/{id}
     */
    public function update(UpdateCountryRequest $request, int $id): JsonResponse
    {
        $country = Country::findOrFail($id);
        $country->update($request->validated());
        Country::clearCache();

        Log::info('Country updated by admin', [
            'code' => $country->code,
            'admin_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => __('messages.country.updated'),
            'data' => $country->fresh()->load('cities'),
        ]);
    }

    /**
     * POST /api/admin/countries/{id}/toggle
     */
    public function toggle(int $id): JsonResponse
    {
        $country = Country::findOrFail($id);
        $country->update(['is_active' => !$country->is_active]);
        Country::clearCache();

        Log::info('Country toggled by admin', [
            'code' => $country->code,
            'is_active' => $country->is_active,
            'admin_id' => request()->user()->id,
        ]);

        return response()->json([
            'message' => $country->is_active
                ? __('messages.country.activated')
                : __('messages.country.deactivated'),
            'data' => $country,
        ]);
    }

    /**
     * DELETE /api/admin/countries/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $country = Country::findOrFail($id);

        $usageCount = DB::table('trips')
                ->where('departure_country_id', $id)
                ->orWhere('arrival_country_id', $id)
                ->count()
            + DB::table('shipments')
                ->where('pickup_country_id', $id)
                ->orWhere('delivery_country_id', $id)
                ->count();

        if ($usageCount > 0) {
            return response()->json([
                'message' => __('messages.country.in_use', ['count' => $usageCount]),
            ], 422);
        }

        $country->delete();
        Country::clearCache();

        Log::info('Country deleted by admin', [
            'code' => $country->code,
            'admin_id' => request()->user()->id,
        ]);

        return response()->json([
            'message' => __('messages.country.deleted'),
        ]);
    }
}
