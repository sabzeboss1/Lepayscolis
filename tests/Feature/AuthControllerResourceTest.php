<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test AuthController uses UserResource correctly
 * 
 * Validates Requirements: 10.3, 12.14
 */
class AuthControllerResourceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test registration returns user data via UserResource
     * 
     * @return void
     */
    public function test_registration_returns_user_resource(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ]);

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
                    'updated_at',
                ],
            ]);

        // Verify all fields are present
        $this->assertArrayHasKey('email', $response->json('user'));
        $this->assertArrayHasKey('phone', $response->json('user'));
        $this->assertArrayHasKey('kyc_status', $response->json('user'));
        $this->assertArrayHasKey('locale', $response->json('user'));
    }

    /**
     * Test login returns user data via UserResource
     * 
     * @return void
     */
    public function test_login_returns_user_resource(): void
    {
        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => bcrypt('password123'),
            'kyc_status' => 'approved',
            'locale' => 'en',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
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
                    'updated_at',
                ],
            ]);

        // Verify all fields are present including sensitive ones
        $this->assertEquals($user->email, $response->json('user.email'));
        $this->assertEquals($user->phone, $response->json('user.phone'));
        $this->assertEquals('approved', $response->json('user.kyc_status'));
        $this->assertEquals('en', $response->json('user.locale'));
    }

    /**
     * Test /api/auth/me returns user data via UserResource
     * 
     * @return void
     */
    public function test_me_endpoint_returns_user_resource(): void
    {
        $user = User::factory()->create([
            'name' => 'Authenticated User',
            'email' => 'auth@example.com',
            'phone' => '+33698765432',
            'kyc_status' => 'approved',
            'locale' => 'en',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

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
            ]);

        // Verify all fields match the user
        $this->assertEquals($user->id, $response->json('user.id'));
        $this->assertEquals('Authenticated User', $response->json('user.name'));
        $this->assertEquals('auth@example.com', $response->json('user.email'));
        $this->assertEquals('+33698765432', $response->json('user.phone'));
        $this->assertEquals('approved', $response->json('user.kyc_status'));
        $this->assertEquals('en', $response->json('user.locale'));
    }

    /**
     * Test UserResource includes sensitive fields for own profile
     * 
     * @return void
     */
    public function test_user_resource_includes_sensitive_fields_for_own_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'sensitive@example.com',
            'phone' => '+33600000000',
            'kyc_status' => 'pending',
            'locale' => 'fr',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertStatus(200);

        // Verify sensitive fields are included
        $userData = $response->json('user');
        $this->assertArrayHasKey('email', $userData);
        $this->assertArrayHasKey('phone', $userData);
        $this->assertArrayHasKey('kyc_status', $userData);
        $this->assertArrayHasKey('locale', $userData);

        $this->assertEquals('sensitive@example.com', $userData['email']);
        $this->assertEquals('+33600000000', $userData['phone']);
        $this->assertEquals('pending', $userData['kyc_status']);
        $this->assertEquals('fr', $userData['locale']);
    }

    /**
     * Test dates are formatted as ISO 8601 in responses
     * 
     * @return void
     */
    public function test_dates_are_formatted_as_iso8601(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertStatus(200);

        $userData = $response->json('user');
        
        // Verify ISO 8601 format (YYYY-MM-DDTHH:MM:SS.sssZ)
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/',
            $userData['created_at']
        );
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/',
            $userData['updated_at']
        );
    }

    /**
     * Test UserResource handles null avatar correctly
     * 
     * @return void
     */
    public function test_user_resource_handles_null_avatar(): void
    {
        $user = User::factory()->create([
            'avatar' => null,
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'avatar' => null,
                ],
            ]);
    }

    /**
     * Test UserResource with recommended user
     * 
     * @return void
     */
    public function test_user_resource_with_recommended_user(): void
    {
        $user = User::factory()->create([
            'rating' => 4.8,
            'completed_deliveries' => 15,
            'is_recommended' => true,
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'rating' => 4.8,
                    'completed_deliveries' => 15,
                    'is_recommended' => true,
                ],
            ]);
    }
}
