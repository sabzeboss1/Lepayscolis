<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Country;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user.
     *
     * @param RegisterRequest $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $ipAddress = $request->ip();
        
        try {
            // Resolve locale and currency from the selected country
            $country = Country::findByCode($request->country);
            $locale = $request->locale ?? ($country?->default_locale ?? 'fr');
            $currencyCode = $country?->default_currency_code ?? 'EUR';

            // Create user with hashed password (bcrypt cost 10)
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password, // Will be auto-hashed by the model cast
                'phone' => $request->phone,
                'locale' => $locale,
                'currency_code' => $currencyCode,
                'kyc_status' => 'not_submitted',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
            ]);

            // Generate Sanctum token (7-day expiration)
            $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

            // Log successful authentication attempt
            Log::info('User registered successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip_address' => $ipAddress,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => __('messages.auth.register_success'),
                'token' => $token,
                'user' => new UserResource($user),
            ], 201);
        } catch (\Exception $e) {
            // Log failed authentication attempt
            Log::error('User registration failed', [
                'email' => $request->email,
                'ip_address' => $ipAddress,
                'error' => $e->getMessage(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => __('messages.auth.register_failed'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login a user.
     *
     * @param LoginRequest $request
     * @return JsonResponse
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $ipAddress = $request->ip();

        try {
            // Find user by email
            $user = User::where('email', $request->email)->first();

            // Validate credentials
            if (!$user || !Hash::check($request->password, $user->password)) {
                // Log failed authentication attempt
                Log::warning('Login attempt failed - invalid credentials', [
                    'email' => $request->email,
                    'ip_address' => $ipAddress,
                    'timestamp' => now(),
                ]);

                throw ValidationException::withMessages([
                    'email' => [__('validation.auth.invalid_credentials')],
                ]);
            }

            // Generate Sanctum token (7-day expiration)
            $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

            // Log successful authentication attempt
            Log::info('User logged in successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip_address' => $ipAddress,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => __('messages.auth.login_success'),
                'token' => $token,
                'user' => new UserResource($user),
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            // Log failed authentication attempt
            Log::error('Login failed', [
                'email' => $request->email,
                'ip_address' => $ipAddress,
                'error' => $e->getMessage(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => __('messages.auth.login_failed'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get authenticated user data.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ], 200);
    }

    /**
     * Logout the authenticated user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $ipAddress = $request->ip();

        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        // Log logout
        Log::info('User logged out', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip_address' => $ipAddress,
            'timestamp' => now(),
        ]);

        return response()->json([
            'message' => __('messages.auth.logout_success'),
        ], 200);
    }
}
