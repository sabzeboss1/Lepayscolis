<?php

namespace App\Http\Controllers;

use App\Models\RechargeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RechargeRequestController extends Controller
{
    /**
     * Get all recharge requests for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 20);
        
        $requests = RechargeRequest::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $requests->items(),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    /**
     * Get a specific recharge request.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $rechargeRequest = RechargeRequest::where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $rechargeRequest,
        ]);
    }

    /**
     * Create a new recharge request.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:5',
            'payment_method' => 'required|string',
            'payment_details' => 'nullable|array',
        ]);

        $user = $request->user();

        $rechargeRequest = RechargeRequest::create([
            'user_id' => $user->id,
            'amount' => $validated['amount'],
            'currency_code' => $user->currency_code ?? 'EUR',
            'payment_method' => $validated['payment_method'],
            'payment_details' => $validated['payment_details'] ?? null,
            'status' => 'pending',
        ]);

        // TODO: Send notification to admins via email or push notification
        // For now, admins will see the request in their dashboard

        return response()->json([
            'success' => true,
            'message' => 'Demande de recharge créée avec succès',
            'data' => $rechargeRequest,
        ], 201);
    }
}
