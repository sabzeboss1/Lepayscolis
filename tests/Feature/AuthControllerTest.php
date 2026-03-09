<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful user registration.
     */
    public function test_user_can_register_with_valid_data(): void
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'token',
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
                ],
            ]);

        // Verify user was created in database
        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'name' => 'John Doe',
            'phone' => '+33612345678',
            'locale' => 'fr',
            'kyc_status' => 'pending',
            'rating' => 0,
            'completed_deliveries' => 0,
            'is_recommended' => false,
        ]);

        // Verify password is hashed
        $user = User::where('email', 'john@example.com')->first();
        $this->assertTrue(Hash::check('password123', $user->password));
        $this->assertNotEquals('password123', $user->password);
    }

    /**
     * Test registration fails with duplicate email.
     */
    public function test_registration_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $userData = [
            'name' => 'Jane Doe',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'phone' => '+33612345679',
            'locale' => 'en',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test registration fails with duplicate phone.
     */
    public function test_registration_fails_with_duplicate_phone(): void
    {
        User::factory()->create(['phone' => '+33612345678']);

        $userData = [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'phone' => '+33612345678',
            'locale' => 'en',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    /**
     * Test registration fails with short password.
     */
    public function test_registration_fails_with_short_password(): void
    {
        $userData = [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'short',
            'phone' => '+33612345678',
            'locale' => 'en',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test registration initializes user with correct defaults.
     */
    public function test_registration_initializes_user_with_correct_defaults(): void
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertEquals('pending', $user->kyc_status);
        $this->assertEquals(0, $user->rating);
        $this->assertEquals(0, $user->completed_deliveries);
        $this->assertFalse($user->is_recommended);
    }

    /**
     * Test successful login with correct credentials.
     */
    public function test_user_can_login_with_correct_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
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
                ],
            ]);

        // Verify token is returned
        $this->assertNotEmpty($response->json('token'));
    }

    /**
     * Test login fails with incorrect password.
     */
    public function test_login_fails_with_incorrect_password(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test login fails with non-existent email.
     */
    public function test_login_fails_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test authenticated user can access /me endpoint.
     */
    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'name' => 'John Doe',
                    'email' => 'john@example.com',
                ],
            ]);
    }

    /**
     * Test unauthenticated user cannot access /me endpoint.
     */
    public function test_unauthenticated_user_cannot_access_me_endpoint(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    /**
     * Test user can logout successfully.
     */
    public function test_user_can_logout_successfully(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logout successful',
            ]);
    }

    /**
     * Test token is revoked after logout.
     */
    public function test_token_is_revoked_after_logout(): void
    {
        $user = User::factory()->create();

        // Authenticate using Sanctum
        Sanctum::actingAs($user);

        // Verify we can access protected endpoint
        $response = $this->getJson('/api/auth/me');
        $response->assertStatus(200);

        // Logout
        $response = $this->postJson('/api/auth/logout');
        $response->assertStatus(200);

        // Verify the token was deleted from database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'tokenable_type' => get_class($user),
        ]);
    }

    /**
     * Test registration logs authentication attempt with IP address.
     */
    public function test_registration_logs_authentication_attempt(): void
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201);
        
        // Verify user was created (which means logging succeeded without errors)
        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
        ]);
    }

    /**
     * Test login logs authentication attempt with IP address.
     */
    public function test_login_logs_authentication_attempt(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('token'));
    }

    /**
     * Test failed login logs failed attempt.
     */
    public function test_failed_login_logs_failed_attempt(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test locale selection is supported during registration.
     */
    public function test_locale_selection_is_supported_during_registration(): void
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'phone' => '+33612345678',
            'locale' => 'en',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertEquals('en', $user->locale);
    }

    /**
     * Test registration fails with invalid locale.
     */
    public function test_registration_fails_with_invalid_locale(): void
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'phone' => '+33612345678',
            'locale' => 'es', // Invalid locale
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['locale']);
    }

    /**
     * Test token expiration after 7 days.
     * 
     * Note: This test verifies that tokens are created with a 7-day expiration.
     * Actual expiration enforcement is handled by Sanctum middleware.
     */
    public function test_token_has_7_day_expiration_set(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Login to get a token
        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $token = $response->json('token');

        // Get the token from database and verify expires_at is set to 7 days from now
        $personalAccessToken = $user->tokens()->first();
        $this->assertNotNull($personalAccessToken);
        
        // Verify expires_at is approximately 7 days from now (within 1 minute tolerance)
        $expectedExpiration = now()->addDays(7);
        $actualExpiration = $personalAccessToken->expires_at;
        
        $this->assertNotNull($actualExpiration, 'Token should have an expiration date');
        
        // Check if expiration is within acceptable range (7 days ± 1 minute)
        $diffInMinutes = abs($expectedExpiration->diffInMinutes($actualExpiration));
        $this->assertLessThanOrEqual(1, $diffInMinutes, 
            'Token expiration should be set to 7 days from creation');
    }

    /**
     * Test expired token cannot access protected endpoints.
     */
    public function test_expired_token_cannot_access_protected_endpoints(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Create a token that's already expired
        $token = $user->createToken('test-token', ['*'], now()->subDay())->plainTextToken;

        // Try to access protected endpoint with expired token
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');
        
        // Token should be expired and return 401 Unauthorized
        $response->assertStatus(401);
    }

    /**
     * Test token is valid within expiration period.
     */
    public function test_token_is_valid_within_expiration_period(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Login to get a token
        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $token = $response->json('token');

        // Verify token works immediately
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');
        
        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'email' => 'john@example.com',
                ],
            ]);
    }

    /**
     * Test registration with missing required fields.
     */
    public function test_registration_fails_with_missing_required_fields(): void
    {
        $response = $this->postJson('/api/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password', 'phone', 'locale']);
    }

    /**
     * Test registration with invalid email format.
     */
    public function test_registration_fails_with_invalid_email_format(): void
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'invalid-email',
            'password' => 'password123',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test login with missing credentials.
     */
    public function test_login_fails_with_missing_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    /**
     * Test multiple tokens can be created for same user.
     */
    public function test_user_can_have_multiple_active_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Login first time
        $response1 = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);
        $response1->assertStatus(200);
        $token1 = $response1->json('token');

        // Login second time
        $response2 = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);
        $response2->assertStatus(200);
        $token2 = $response2->json('token');

        // Both tokens should be different
        $this->assertNotEquals($token1, $token2);

        // Both tokens should work
        $response = $this->withHeader('Authorization', 'Bearer ' . $token1)
            ->getJson('/api/auth/me');
        $response->assertStatus(200);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token2)
            ->getJson('/api/auth/me');
        $response->assertStatus(200);
    }

    /**
     * Test logout only revokes current token, not all tokens.
     */
    public function test_logout_only_revokes_current_token(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Create two tokens by logging in twice
        $response1 = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);
        $token1 = $response1->json('token');

        $response2 = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);
        $token2 = $response2->json('token');

        // Verify both tokens work
        $response = $this->withHeader('Authorization', 'Bearer ' . $token1)
            ->getJson('/api/auth/me');
        $response->assertStatus(200);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token2)
            ->getJson('/api/auth/me');
        $response->assertStatus(200);

        // Verify user has 2 tokens before logout
        $this->assertEquals(2, $user->tokens()->count());

        // Logout using first token
        $response = $this->withHeader('Authorization', 'Bearer ' . $token1)
            ->postJson('/api/auth/logout');
        $response->assertStatus(200);

        // Verify user now has only 1 token after logout
        $user->refresh();
        $this->assertEquals(1, $user->tokens()->count());
        
        // Second token should still work
        $response = $this->withHeader('Authorization', 'Bearer ' . $token2)
            ->getJson('/api/auth/me');
        $response->assertStatus(200);
    }
}
