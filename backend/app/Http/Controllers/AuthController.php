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
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

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

    /**
     * Send password reset link to user's email.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $ipAddress = $request->ip();

        try {
            // Check if user exists
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                // For security, don't reveal if email exists or not
                Log::warning('Password reset requested for non-existent email', [
                    'email' => $request->email,
                    'ip_address' => $ipAddress,
                    'timestamp' => now(),
                ]);

                return response()->json([
                    'message' => __('messages.auth.password_reset_sent'),
                ], 200);
            }

            // Send password reset link
            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status === Password::RESET_LINK_SENT) {
                Log::info('Password reset link sent', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'ip_address' => $ipAddress,
                    'timestamp' => now(),
                ]);

                return response()->json([
                    'message' => __('messages.auth.password_reset_sent'),
                ], 200);
            }

            Log::error('Failed to send password reset link', [
                'email' => $request->email,
                'ip_address' => $ipAddress,
                'status' => $status,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => __('messages.auth.password_reset_failed'),
            ], 500);
        } catch (\Exception $e) {
            Log::error('Password reset request failed', [
                'email' => $request->email,
                'ip_address' => $ipAddress,
                'error' => $e->getMessage(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => __('messages.auth.password_reset_failed'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset user's password.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $ipAddress = $request->ip();

        try {
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function (User $user, string $password) use ($ipAddress) {
                    $user->forceFill([
                        'password' => $password,
                        'remember_token' => Str::random(60),
                    ])->save();

                    // Revoke all existing tokens for security
                    $user->tokens()->delete();

                    Log::info('Password reset successful', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'ip_address' => $ipAddress,
                        'timestamp' => now(),
                    ]);
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                return response()->json([
                    'message' => __('messages.auth.password_reset_success'),
                ], 200);
            }

            Log::warning('Password reset failed - invalid token', [
                'email' => $request->email,
                'ip_address' => $ipAddress,
                'status' => $status,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => __($status),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Password reset failed', [
                'email' => $request->email,
                'ip_address' => $ipAddress,
                'error' => $e->getMessage(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => __('messages.auth.password_reset_failed'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
