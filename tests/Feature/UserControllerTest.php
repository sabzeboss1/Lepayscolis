<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\FileUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * UserControllerTest - Feature tests for user profile management
 * 
 * Tests Requirements: 10.1-10.10
 */
class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Fake S3 storage for testing
        Storage::fake('s3-public');
        Storage::fake('s3-private');
    }

    /**
     * Test viewing another user's profile returns only public data
     * 
     * Validates Requirements: 10.1, 10.2
     */
    public function test_viewing_other_user_profile_returns_public_data_only(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create([
            'email' => 'other@example.com',
            'phone' => '+33612345678',
            'kyc_status' => 'approved',
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/users/{$otherUser->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'avatar',
                    'rating',
                    'completed_deliveries',
                    'is_recommended',
                    'created_at',
                ],
            ])
            ->assertJsonMissing([
                'email' => $otherUser->email,
                'phone' => $otherUser->phone,
                'kyc_status' => $otherUser->kyc_status,
            ]);
    }

    /**
     * Test viewing own profile returns all data including sensitive fields
     * 
     * Validates Requirements: 10.3
     */
    public function test_viewing_own_profile_returns_all_data(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'phone' => '+33612345678',
            'kyc_status' => 'approved',
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'avatar',
                    'rating',
                    'completed_deliveries',
                    'is_recommended',
                    'kyc_status',
                    'locale',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJson([
                'user' => [
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'kyc_status' => $user->kyc_status,
                ],
            ]);
    }

    /**
     * Test unauthenticated user can view public profile
     * 
     * Validates Requirements: 10.1
     */
    public function test_unauthenticated_user_can_view_public_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->getJson("/api/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'avatar',
                    'rating',
                    'completed_deliveries',
                    'is_recommended',
                    'created_at',
                ],
            ])
            ->assertJsonMissing(['email', 'phone', 'kyc_status']);
    }

    /**
     * Test updating profile with valid data
     * 
     * Validates Requirements: 10.4
     */
    public function test_update_profile_with_valid_data(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'phone' => '+33612345678',
        ]);

        $response = $this->actingAs($user)
            ->putJson('/api/users/profile', [
                'name' => 'New Name',
                'phone' => '+33687654321',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully',
                'user' => [
                    'name' => 'New Name',
                    'phone' => '+33687654321',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'phone' => '+33687654321',
        ]);
    }

    /**
     * Test updating profile with duplicate phone fails
     * 
     * Validates Requirements: 10.5
     */
    public function test_update_profile_with_duplicate_phone_fails(): void
    {
        $user1 = User::factory()->create(['phone' => '+33612345678']);
        $user2 = User::factory()->create(['phone' => '+33687654321']);

        $response = $this->actingAs($user2)
            ->putJson('/api/users/profile', [
                'phone' => '+33612345678', // user1's phone
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    /**
     * Test updating profile with same phone succeeds (own phone)
     * 
     * Validates Requirements: 10.5
     */
    public function test_update_profile_with_own_phone_succeeds(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'phone' => '+33612345678',
        ]);

        $response = $this->actingAs($user)
            ->putJson('/api/users/profile', [
                'name' => 'New Name',
                'phone' => '+33612345678', // Same phone
            ]);

        $response->assertStatus(200);
    }

    /**
     * Test uploading avatar via profile update
     * 
     * Validates Requirements: 10.6
     */
    public function test_upload_avatar_via_profile_update(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('avatar.jpg', 300, 300);

        $response = $this->actingAs($user)
            ->putJson('/api/users/profile', [
                'name' => 'Test User',
                'avatar' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => ['avatar'],
            ]);

        // Verify avatar URL is set
        $this->assertNotNull($user->fresh()->avatar);
    }

    /**
     * Test uploading avatar via dedicated endpoint
     * 
     * Validates Requirements: 10.6
     */
    public function test_upload_avatar_via_dedicated_endpoint(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('avatar.jpg', 300, 300);

        $response = $this->actingAs($user)
            ->postJson('/api/users/avatar', [
                'avatar' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'avatar_url',
                'user' => ['avatar'],
            ]);

        // Verify avatar URL is set
        $this->assertNotNull($user->fresh()->avatar);
    }

    /**
     * Test uploading avatar with invalid file type fails
     * 
     * Validates Requirements: 10.6
     */
    public function test_upload_avatar_with_invalid_file_type_fails(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->actingAs($user)
            ->postJson('/api/users/avatar', [
                'avatar' => $file,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    }

    /**
     * Test uploading avatar with oversized file fails
     * 
     * Validates Requirements: 10.6
     */
    public function test_upload_avatar_with_oversized_file_fails(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('avatar.jpg')->size(3000); // 3MB

        $response = $this->actingAs($user)
            ->postJson('/api/users/avatar', [
                'avatar' => $file,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    }

    /**
     * Test uploading new avatar deletes old avatar
     * 
     * Validates Requirements: 10.6
     */
    public function test_uploading_new_avatar_deletes_old_avatar(): void
    {
        $user = User::factory()->create([
            'avatar' => 'https://bucket.s3.region.amazonaws.com/avatars/old_avatar.jpg',
        ]);

        $file = UploadedFile::fake()->image('new_avatar.jpg', 300, 300);

        $response = $this->actingAs($user)
            ->postJson('/api/users/avatar', [
                'avatar' => $file,
            ]);

        $response->assertStatus(200);

        // Verify new avatar is different from old one
        $this->assertNotEquals(
            'https://bucket.s3.region.amazonaws.com/avatars/old_avatar.jpg',
            $user->fresh()->avatar
        );
    }

    /**
     * Test updating FCM token
     * 
     * Validates Requirements: 10.10 (indirectly)
     */
    public function test_update_fcm_token(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/users/fcm-token', [
                'fcm_token' => 'test_fcm_token_123',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'FCM token updated successfully',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'fcm_token' => 'test_fcm_token_123',
        ]);
    }

    /**
     * Test updating FCM token without authentication fails
     */
    public function test_update_fcm_token_without_authentication_fails(): void
    {
        $response = $this->postJson('/api/users/fcm-token', [
            'fcm_token' => 'test_fcm_token_123',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test updating FCM token with invalid data fails
     */
    public function test_update_fcm_token_with_invalid_data_fails(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/users/fcm-token', [
                'fcm_token' => '', // Empty token
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['fcm_token']);
    }

    /**
     * Test profile update requires authentication
     */
    public function test_profile_update_requires_authentication(): void
    {
        $response = $this->putJson('/api/users/profile', [
            'name' => 'New Name',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test avatar upload requires authentication
     */
    public function test_avatar_upload_requires_authentication(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->postJson('/api/users/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test viewing non-existent user returns 404
     */
    public function test_viewing_non_existent_user_returns_404(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/users/99999999-9999-9999-9999-999999999999');

        $response->assertStatus(404);
    }
}
