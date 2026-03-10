<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SanctumInstallationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that Sanctum is properly installed and configured.
     */
    public function test_sanctum_can_create_token_for_user(): void
    {
        // Create a user
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Create a token for the user
        $token = $user->createToken('test-token');

        // Assert token was created
        $this->assertNotNull($token);
        $this->assertNotNull($token->plainTextToken);
        $this->assertInstanceOf(\Laravel\Sanctum\NewAccessToken::class, $token);
    }

    /**
     * Test that authenticated requests work with Sanctum.
     */
    public function test_authenticated_request_with_sanctum_token(): void
    {
        // Create a user
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'name' => 'Test User',
        ]);

        // Create a token
        $token = $user->createToken('test-token')->plainTextToken;

        // Make an authenticated request
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user');

        // Assert the response is successful and returns user data
        $response->assertStatus(200)
            ->assertJson([
                'id' => $user->id,
                'email' => 'test@example.com',
                'name' => 'Test User',
            ]);
    }

    /**
     * Test that unauthenticated requests are rejected.
     */
    public function test_unauthenticated_request_is_rejected(): void
    {
        // Make a request without authentication
        $response = $this->getJson('/api/user');

        // Assert the response is unauthorized
        $response->assertStatus(401);
    }

    /**
     * Test that invalid tokens are rejected.
     */
    public function test_invalid_token_is_rejected(): void
    {
        // Make a request with an invalid token
        $response = $this->withHeader('Authorization', 'Bearer invalid-token-12345')
            ->getJson('/api/user');

        // Assert the response is unauthorized
        $response->assertStatus(401);
    }

    /**
     * Test that token expiration is configured to 7 days.
     */
    public function test_token_expiration_is_configured(): void
    {
        // Check that the expiration is set to 10080 minutes (7 days)
        $expiration = config('sanctum.expiration');
        
        $this->assertEquals(10080, $expiration, 'Sanctum token expiration should be set to 10080 minutes (7 days)');
    }
}
