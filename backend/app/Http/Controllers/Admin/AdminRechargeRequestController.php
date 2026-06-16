<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RechargeRequest;
use App\Models\User;
use App\Notifications\AdminRechargeCompletedNotification;
use App\Notifications\RechargeRequestCompletedNotification;
use App\Notifications\RechargeRequestProcessingNotification;
use App\Notifications\RechargeRequestRejectedNotification;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class AdminRechargeRequestController extends Controller
{
    public function __construct(
        private WalletService $walletService
    ) {}

    /**
     * Get all recharge requests with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status');
        $search = $request->input('search');
        $perPage = $request->input('per_page', 20);

        $query = RechargeRequest::with(['user', 'processedBy'])
            ->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $requests = $query->paginate($perPage);

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
    public function show(string $id): JsonResponse
    {
        $request = RechargeRequest::with(['user', 'processedBy'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $request,
        ]);
    }

    /**
     * Mark request as processing.
     */
    public function markProcessing(Request $request, string $id): JsonResponse
    {
        $rechargeRequest = RechargeRequest::findOrFail($id);

        if ($rechargeRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les demandes en attente peuvent être marquées comme en cours de traitement',
            ], 422);
        }

        $rechargeRequest->update([
            'status' => 'processing',
            'processed_by' => $request->user()->id,
        ]);

        // Notify the user
        $rechargeRequest->user->notify(new RechargeRequestProcessingNotification($rechargeRequest));

        return response()->json([
            'success' => true,
            'message' => 'Demande marquée comme en cours de traitement',
            'data' => $rechargeRequest->fresh(['user', 'processedBy']),
        ]);
    }

    /**
     * Complete recharge request and credit user wallet.
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $rechargeRequest = RechargeRequest::with('user.wallet')->findOrFail($id);

        if (!in_array($rechargeRequest->status, ['pending', 'processing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande a déjà été traitée',
            ], 422);
        }

        if (!$rechargeRequest->user->wallet) {
            return response()->json([
                'success' => false,
                'message' => 'L\'utilisateur n\'a pas de portefeuille',
            ], 422);
        }

        DB::transaction(function () use ($rechargeRequest, $validated, $request) {
            // Credit user wallet
            $this->walletService->credit(
                $rechargeRequest->user->wallet,
                $rechargeRequest->amount,
                "Recharge via {$rechargeRequest->payment_method}",
                'recharge_request',
                $rechargeRequest->id
            );

            // Update recharge request
            $rechargeRequest->update([
                'status' => 'completed',
                'admin_notes' => $validated['admin_notes'] ?? null,
                'processed_by' => $request->user()->id,
                'processed_at' => now(),
            ]);
        });

        $fresh = $rechargeRequest->fresh(['user', 'processedBy']);

        // Notify the user
        $fresh->user->notify(new RechargeRequestCompletedNotification($fresh));

        // Notify all admins and super_admins (confirmation de traitement)
        $admins = User::whereIn('role', ['admin', 'super_admin'])->get();
        Notification::send($admins, new AdminRechargeCompletedNotification($fresh));

        return response()->json([
            'success' => true,
            'message' => 'Recharge effectuée avec succès',
            'data' => $fresh,
        ]);
    }

    /**
     * Reject recharge request.
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'admin_notes' => 'required|string|max:1000',
        ]);

        $rechargeRequest = RechargeRequest::findOrFail($id);

        if (!in_array($rechargeRequest->status, ['pending', 'processing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande a déjà été traitée',
            ], 422);
        }

        $rechargeRequest->update([
            'status' => 'rejected',
            'admin_notes' => $validated['admin_notes'],
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        $fresh = $rechargeRequest->fresh(['user', 'processedBy']);

        // Notify the user
        $fresh->user->notify(new RechargeRequestRejectedNotification($fresh));

        return response()->json([
            'success' => true,
            'message' => 'Demande rejetée',
            'data' => $fresh,
        ]);
    }
}
