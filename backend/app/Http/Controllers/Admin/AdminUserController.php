<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignAdminRoleRequest;
use App\Http\Requests\Admin\BanMessagingRequest;
use App\Http\Requests\Admin\SuspendUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Http\Resources\Admin\UserDetailResource;
use App\Services\Admin\AdminMessagingService;
use App\Services\Admin\AdminUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminUserController extends Controller
{
    protected AdminUserService $userService;
    protected AdminMessagingService $messagingService;

    public function __construct(
        AdminUserService $userService,
        AdminMessagingService $messagingService
    ) {
        $this->userService = $userService;
        $this->messagingService = $messagingService;
    }

    /**
     * Get paginated list of users
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'status', 'role', 'kyc_status']);
        $perPage = $request->input('per_page', 50);

        $users = $this->userService->getUsers($filters, $perPage);

        return response()->json([
            'data' => AdminUserResource::collection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ], 200);
    }

    /**
     * Create a new user
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|unique:users,phone',
            'password' => 'required|string|min:8',
            'role' => 'nullable|in:user,admin,super_admin',
        ]);

        $user = $this->userService->createUser($validated, $request->user());

        return response()->json([
            'data' => new AdminUserResource($user),
            'message' => 'User created successfully',
        ], 201);
    }

    /**
     * Get user details
     */
    public function show(int $id): JsonResponse
    {
        try {
            $details = $this->userService->getUserDetails($id);
            $user = $details['user'];

            return response()->json([
                'data' => array_merge(
                    (new UserDetailResource($user))->resolve(),
                    [
                        'activity_history' => $details['activity_history'],
                        'recent_transactions' => $details['recent_transactions'],
                    ]
                ),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }
    }

    /**
     * Update user
     */
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = $this->userService->updateUser($id, $request->validated(), $request->user());

        return response()->json([
            'data' => new AdminUserResource($user),
            'message' => 'User updated successfully',
        ], 200);
    }

    /**
     * Suspend user
     */
    public function suspend(SuspendUserRequest $request, int $id): JsonResponse
    {
        $user = $this->userService->suspendUser($id, $request->reason, $request->user());

        return response()->json([
            'data' => new AdminUserResource($user),
            'message' => 'User suspended successfully',
        ], 200);
    }

    /**
     * Activate user
     */
    public function activate(Request $request, int $id): JsonResponse
    {
        $user = $this->userService->activateUser($id, $request->user());

        return response()->json([
            'data' => new AdminUserResource($user),
            'message' => 'User activated successfully',
        ], 200);
    }

    /**
     * Assign admin role (super admin only)
     */
    public function assignAdmin(AssignAdminRoleRequest $request, int $id): JsonResponse
    {
        $user = $this->userService->assignAdminRole($id, $request->role, $request->user());

        return response()->json([
            'data' => new AdminUserResource($user),
            'message' => 'Admin role assigned successfully',
        ], 200);
    }

    /**
     * Delete user
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->userService->deleteUser($id, $request->user());

        return response()->json(null, 204);
    }

    /**
     * Bulk suspend users
     */
    public function bulkSuspend(Request $request): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $count = $this->userService->bulkSuspend($request->user_ids, $request->user());

        return response()->json([
            'message' => "{$count} user(s) suspended successfully",
            'count' => $count,
        ], 200);
    }

    /**
     * Bulk activate users
     */
    public function bulkActivate(Request $request): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $count = $this->userService->bulkActivate($request->user_ids, $request->user());

        return response()->json([
            'message' => "{$count} user(s) activated successfully",
            'count' => $count,
        ], 200);
    }

    /**
     * Ban user from messaging
     */
    public function banMessaging(BanMessagingRequest $request, int $id): JsonResponse
    {
        $user = $this->messagingService->banUserFromMessaging($id, $request->reason, $request->user());

        return response()->json([
            'data' => new AdminUserResource($user),
            'message' => 'User banned from messaging successfully',
        ], 200);
    }

    /**
     * Unban user from messaging
     */
    public function unbanMessaging(Request $request, int $id): JsonResponse
    {
        $user = $this->messagingService->unbanUserFromMessaging($id, $request->user());

        return response()->json([
            'data' => new AdminUserResource($user),
            'message' => 'User unbanned from messaging successfully',
        ], 200);
    }

    /**
     * Export users data
     */
    public function export(Request $request): StreamedResponse
    {
        $request->validate([
            'format' => 'required|in:csv,excel',
            'filters' => 'nullable|array',
        ]);

        $format = $request->input('format', 'csv');
        $filters = $request->input('filters', []);

        $users = $this->userService->getUsersForExport($filters);

        $filename = 'users_export_' . date('Y-m-d_His') . '.' . ($format === 'excel' ? 'xlsx' : 'csv');

        return $this->exportToCsv($users, $filename);
    }

    private function exportToCsv($users, string $filename): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'max-age=0',
        ];

        $callback = function () use ($users) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($file, ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'KYC Status', 'Email Verified', 'Phone Verified', 'Country', 'City', 'Address', 'Wallet Balance', 'Total Shipments', 'Total Trips', 'Average Rating', 'Created At', 'Last Login']);

            foreach ($users as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->phone,
                    $user->role,
                    $user->status,
                    $user->kyc_status ?? 'not_submitted',
                    $user->email_verified_at ? 'Yes' : 'No',
                    $user->phone_verified_at ? 'Yes' : 'No',
                    $user->country ?? '',
                    $user->city ?? '',
                    $user->address ?? '',
                    $user->wallet ? number_format($user->wallet->balance, 2) : '0.00',
                    $user->shipments_count ?? 0,
                    $user->trips_count ?? 0,
                    $user->average_rating ?? 'N/A',
                    $user->created_at->format('Y-m-d H:i:s'),
                    $user->last_login_at ? $user->last_login_at->format('Y-m-d H:i:s') : 'Never',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
