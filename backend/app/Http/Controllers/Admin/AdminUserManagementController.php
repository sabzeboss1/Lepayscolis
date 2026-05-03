<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserManagementController extends Controller
{
    /**
     * Get list of admin users (super admin only)
     */
    public function index(): JsonResponse
    {
        $admins = User::whereIn('role', ['admin', 'super_admin'])
            ->withCount(['auditLogs'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => AdminUserResource::collection($admins),
        ], 200);
    }

    /**
     * Create new admin user (super admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['required', 'string', 'unique:users,phone', 'regex:/^\+[1-9]\d{7,14}$/'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'super_admin'])],
        ]);

        // Validate phone length per country prefix
        $phone = $validated['phone'];
        $phoneLengthRules = ['+237' => 9, '+7' => 10, '+33' => 9, '+1' => 10];
        foreach ($phoneLengthRules as $prefix => $expectedDigits) {
            if (str_starts_with($phone, $prefix)) {
                $localDigits = substr($phone, strlen($prefix));
                if (strlen($localDigits) !== $expectedDigits) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'phone' => ["Le numéro doit contenir {$expectedDigits} chiffres après l'indicatif {$prefix}."],
                    ]);
                }
                break;
            }
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'kyc_status' => 'approved',
        ]);

        // Create audit log
        \App\Models\AuditLog::log(
            $request->user(),
            'create_admin',
            'user',
            $user->id,
            null,
            ['role' => $validated['role']]
        );

        return response()->json([
            'data' => new AdminUserResource($user),
            'message' => 'Admin user created successfully',
        ], 201);
    }

    /**
     * Update admin role (super admin only)
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['admin', 'super_admin'])],
        ]);

        $user = User::findOrFail($id);
        $oldRole = $user->role;

        $user->update(['role' => $validated['role']]);

        // Create audit log
        \App\Models\AuditLog::log(
            $request->user(),
            'update_admin_role',
            'user',
            $user->id,
            ['role' => $oldRole],
            ['role' => $validated['role']]
        );

        return response()->json([
            'data' => new AdminUserResource($user),
            'message' => 'Admin role updated successfully',
        ], 200);
    }

    /**
     * Remove admin access (super admin only)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        // Prevent self-revocation
        if ($request->user()->id === $id) {
            return response()->json([
                'message' => 'You cannot revoke your own admin access',
            ], 403);
        }

        // Ensure at least one super admin remains
        $superAdminCount = User::where('role', 'super_admin')->count();
        $user = User::findOrFail($id);

        if ($user->role === 'super_admin' && $superAdminCount <= 1) {
            return response()->json([
                'message' => 'Cannot remove the last super admin',
            ], 403);
        }

        $oldRole = $user->role;
        $user->update(['role' => 'user']);

        // Create audit log
        \App\Models\AuditLog::log(
            $request->user(),
            'remove_admin_access',
            'user',
            $user->id,
            ['role' => $oldRole],
            ['role' => 'user']
        );

        return response()->json(null, 204);
    }

    /**
     * Get admin activity logs (super admin only)
     */
    public function activity(int $id): JsonResponse
    {
        $logs = \App\Models\AuditLog::where('admin_id', $id)
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => \App\Http\Resources\Admin\AuditLogResource::collection($logs),
        ], 200);
    }
}
