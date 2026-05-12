<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicUserResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * UserController - Handle user profile management
 * 
 * Endpoints:
 * - GET /api/users/{id}: Get user profile (public data for others, full data for self)
 * - PUT /api/users/profile: Update own profile (name, phone, avatar)
 * - POST /api/users/avatar: Upload new avatar
 * - POST /api/users/fcm-token: Update FCM token for push notifications
 * 
 * Validates Requirements: 10.1-10.10
 */
class UserController extends Controller
{
    public function __construct(
        private FileUploadService $fileUploadService
    ) {}

    /**
     * Get user profile by ID
     * Returns public data for other users, full data for own profile
     * 
     * Validates Requirements: 10.1, 10.2, 10.3
     * 
     * @param string $id User ID
     * @return JsonResponse
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        // Check if viewing own profile
        $isOwnProfile = $request->user() && $request->user()->id === $user->id;
        
        if ($isOwnProfile) {
            // Return full profile data including sensitive fields
            return response()->json([
                'user' => new UserResource($user),
            ]);
        }
        
        // Return only public profile data
        return response()->json([
            'user' => new PublicUserResource($user),
        ]);
    }

    /**
     * Update authenticated user's profile
     * Allows updating name, phone, and avatar
     * 
     * Validates Requirements: 10.4, 10.5, 10.6, 10.7
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => [
                'sometimes',
                'string',
                'max:20',
                'regex:/^\+[1-9]\d{1,14}$/',
                Rule::unique('users', 'phone')->ignore($user->id),
            ],
            'locale' => 'sometimes|string|in:fr,en',
            'currency_code' => 'sometimes|string|size:3|exists:currencies,code',
            'avatar' => 'sometimes|image|mimes:jpg,jpeg,png|max:2048', // 2MB max
        ]);
        
        // Handle avatar upload if provided
        if ($request->hasFile('avatar')) {
            try {
                // Delete old avatar if exists
                if ($user->avatar) {
                    $this->deleteOldAvatar($user->avatar);
                }
                
                // Upload new avatar
                $avatarUrl = $this->fileUploadService->uploadAvatar(
                    $request->file('avatar'),
                    $user->id
                );
                
                $validated['avatar'] = $avatarUrl;
                
                Log::info('Avatar uploaded successfully', [
                    'user_id' => $user->id,
                    'avatar_url' => $avatarUrl,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to upload avatar', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                
                return response()->json([
                    'message' => __('messages.profile.avatar_failed'),
                    'error' => $e->getMessage(),
                ], 500);
            }
        }
        
        // Update user profile
        $user->update($validated);
        
        // Invalidate cached profile data
        // TODO: Implement cache invalidation when caching is added
        
        Log::info('User profile updated', [
            'user_id' => $user->id,
            'updated_fields' => array_keys($validated),
        ]);
        
        return response()->json([
            'message' => __('messages.profile.updated'),
            'user' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Change authenticated user's password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        Log::info('User password changed', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Mot de passe modifié avec succès.',
        ]);
    }

    /**
     * Upload new avatar for authenticated user
     * Separate endpoint for avatar-only updates
     * 
     * Validates Requirements: 10.6
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png|max:2048', // 2MB max
        ]);
        
        try {
            // Delete old avatar if exists
            if ($user->avatar) {
                $this->deleteOldAvatar($user->avatar);
            }
            
            // Upload new avatar
            $avatarUrl = $this->fileUploadService->uploadAvatar(
                $request->file('avatar'),
                $user->id
            );
            
            // Update user avatar
            $user->avatar = $avatarUrl;
            $user->save();
            
            Log::info('Avatar uploaded successfully', [
                'user_id' => $user->id,
                'avatar_url' => $avatarUrl,
            ]);
            
            return response()->json([
                'message' => __('messages.profile.avatar_uploaded'),
                'avatar_url' => $avatarUrl,
                'user' => new UserResource($user),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to upload avatar', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => __('messages.profile.avatar_failed'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update FCM token for push notifications
     * 
     * Validates Requirements: 10.10 (indirectly - enables push notifications)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateFcmToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fcm_token' => 'required|string|max:255',
        ]);
        
        $user = $request->user();
        $user->fcm_token = $validated['fcm_token'];
        $user->save();
        
        Log::info('FCM token updated', [
            'user_id' => $user->id,
        ]);
        
        return response()->json([
            'message' => __('messages.profile.fcm_updated'),
        ]);
    }

    /**
     * Get the list of supported languages.
     */
    public function supportedLanguages(): JsonResponse
    {
        return response()->json([
            'languages' => [
                ['code' => 'fr', 'name' => 'Français'],
                ['code' => 'en', 'name' => 'English'],
            ],
        ]);
    }

    /**
     * Delete old avatar from storage.
     * Extract path from URL and delete
     *
     * @param string $avatarUrl
     * @return void
     */
    private function deleteOldAvatar(string $avatarUrl): void
    {
        try {
            // Extract path from local storage URL
            // URL format: http://host/storage/avatars/user_id_timestamp.ext
            $path = parse_url($avatarUrl, PHP_URL_PATH);

            if ($path) {
                // Remove /storage/ prefix to get the relative path within the public disk
                $path = preg_replace('#^/storage/#', '', ltrim($path, '/'));

                // Delete file
                $this->fileUploadService->deleteFile($path);

                Log::info('Old avatar deleted', [
                    'path' => $path,
                ]);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the request
            Log::warning('Failed to delete old avatar', [
                'avatar_url' => $avatarUrl,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
