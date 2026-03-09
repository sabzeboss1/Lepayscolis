<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminLoginRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Services\Admin\AdminAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    protected AdminAuthService $authService;

    public function __construct(AdminAuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Admin login
     */
    public function login(AdminLoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login(
                $request->email,
                $request->password,
                $request->ip(),
                $request->userAgent()
            );

            return response()->json([
                'token' => $result['token'],
                'user' => new AdminUserResource($result['user']),
                'expires_at' => $result['expires_at'],
            ], 200);
        } catch (ValidationException $e) {
            $status = $e->status ?? 401;
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], $status);
        }
    }

    /**
     * Get authenticated admin user
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new AdminUserResource($request->user()),
        ], 200);
    }

    /**
     * Admin logout
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        
        $this->authService->logout($request->user(), $token);

        return response()->json([
            'message' => 'Successfully logged out',
        ], 200);
    }
}
