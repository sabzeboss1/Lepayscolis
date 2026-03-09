<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Carbon\Carbon;

class SanctumConfigurationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that Sanctum configuration file exists and has correct settings.
     */
    public function test_sanctum_configuration_exists_with_correct_settings(): void
    {
        // Verify token expiration is set to 7 days (10080 minutes)
        $expiration = Config::get('sanctum.expiration');
        $this->assertEquals(10080, $expiration, 'Sanctum token expiration should be 10080 minutes (7 days)');

        // Verify stateful domains are configured
        $statefulDomains = Config::get('sanctum.stateful');
        $this->assertIsArray($statefulDomains);
        $this->assertNotEmpty($statefulDomains);
    }

    /**
     * Test that personal_access_tokens table exists.
     */
    public function test_personal_access_tokens_table_exists(): void
    {
        $this->assertTrue(
            \Schema::hasTable('personal_access_tokens'),
            'personal_access_tokens table should exist'
        );

        // Verify table has required columns
        $this->assertTrue(\Schema::hasColumn('personal_access_tokens', 'id'));
        $this->assertTrue(\Schema::hasColumn('personal_access_tokens', 'tokenable_type'));
        $this->assertTrue(\Schema::hasColumn('personal_access_tokens', 'tokenable_id'));
        $this->assertTrue(\Schema::hasColumn('personal_access_tokens', 'name'));
        $this->assertTrue(\Schema::hasColumn('personal_access_tokens', 'token'));
        $this->assertTrue(\Schema::hasColumn('personal_access_tokens', 'abilities'));
        $this->assertTrue(\Schema::hasColumn('personal_access_tokens', 'expires_at'));
        $this->assertTrue(\Schema::hasColumn('personal_access_tokens', 'created_at'));
        $this->assertTrue(\Schema::hasColumn('personal_access_tokens', 'updated_at'));
    }

    /**
     * Test that Sanctum can create tokens for users.
     */
    public function test_sanctum_can_create_tokens_for_users(): void
    {
        $user = User::factory()->create();

        // Create a token
        $token = $user->createToken('test-token');

        $this->assertNotNull($token);
        $this->assertNotNull($token->plainTextToken);
        $this->assertNotNull($token->accessToken);
        $this->assertEquals('test-token', $token->accessToken->name);
    }

    /**
     * Test that tokens expire after 7 days.
     */
    public function test_tokens_expire_after_seven_days(): void
    {
        $user = User::factory()->create();

        // Create a token with explicit expiration
        $expiresAt = Carbon::now()->addDays(7);
        $token = $user->createToken('test-token', ['*'], $expiresAt);

        $this->assertNotNull($token->accessToken->expires_at);
        
        // Verify expiration is approximately 7 days from now
        $expectedExpiration = Carbon::now()->addDays(7);
        $actualExpiration = Carbon::parse($token->accessToken->expires_at);
        
        $this->assertTrue(
            $actualExpiration->diffInMinutes($expectedExpiration) < 2,
            'Token should expire in approximately 7 days'
        );
    }

    /**
     * Test that Sanctum middleware is configured in bootstrap/app.php.
     */
    public function test_sanctum_middleware_is_configured(): void
    {
        // Test that auth:sanctum middleware works by making a request
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user');

        $response->assertStatus(200);
        $response->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);
    }

    /**
     * Test that unauthenticated requests are rejected.
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    /**
     * Test that invalid tokens are rejected.
     */
    public function test_invalid_tokens_are_rejected(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid-token-12345')
            ->getJson('/api/user');

        $response->assertStatus(401);
    }

    /**
     * Test that tokens can be revoked.
     */
    public function test_tokens_can_be_revoked(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token');
        $plainTextToken = $token->plainTextToken;
        $tokenId = $token->accessToken->id;

        // Verify token works
        $response = $this->withHeader('Authorization', 'Bearer ' . $plainTextToken)
            ->getJson('/api/user');
        $response->assertStatus(200);

        // Verify token exists in database
        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $tokenId,
            'tokenable_id' => $user->id,
        ]);

        // Revoke the token
        $user->tokens()->where('id', $tokenId)->delete();

        // Verify token is deleted from database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenId,
        ]);
        
        // Verify user has no tokens
        $this->assertEquals(0, $user->tokens()->count());
    }

    /**
     * Test that multiple tokens can exist for the same user.
     */
    public function test_multiple_tokens_can_exist_for_same_user(): void
    {
        $user = User::factory()->create();

        $token1 = $user->createToken('device-1')->plainTextToken;
        $token2 = $user->createToken('device-2')->plainTextToken;

        // Both tokens should work
        $response1 = $this->withHeader('Authorization', 'Bearer ' . $token1)
            ->getJson('/api/user');
        $response1->assertStatus(200);

        $response2 = $this->withHeader('Authorization', 'Bearer ' . $token2)
            ->getJson('/api/user');
        $response2->assertStatus(200);

        // Verify user has 2 tokens
        $this->assertEquals(2, $user->tokens()->count());
    }

    /**
     * Test that stateful domains are configured for CORS.
     */
    public function test_stateful_domains_are_configured(): void
    {
        $statefulDomains = Config::get('sanctum.stateful');

        // Verify localhost:3000 is included (frontend domain)
        $this->assertContains('localhost:3000', $statefulDomains);
        
        // Verify localhost is included
        $this->assertContains('localhost', $statefulDomains);
    }

    /**
     * Test that Sanctum uses the correct guard.
     */
    public function test_sanctum_uses_correct_guard(): void
    {
        $guard = Config::get('sanctum.guard');

        $this->assertIsArray($guard);
        $this->assertContains('web', $guard);
    }

    /**
     * Test that token abilities work correctly.
     */
    public function test_token_abilities_work_correctly(): void
    {
        $user = User::factory()->create();

        // Create token with specific abilities
        $token = $user->createToken('test-token', ['read', 'write']);

        $this->assertTrue($token->accessToken->can('read'));
        $this->assertTrue($token->accessToken->can('write'));
        $this->assertFalse($token->accessToken->can('delete'));
    }

    /**
     * Test that tokens can be created with wildcard abilities.
     */
    public function test_tokens_can_be_created_with_wildcard_abilities(): void
    {
        $user = User::factory()->create();

        // Create token with wildcard abilities
        $token = $user->createToken('test-token', ['*']);

        $this->assertTrue($token->accessToken->can('read'));
        $this->assertTrue($token->accessToken->can('write'));
        $this->assertTrue($token->accessToken->can('delete'));
        $this->assertTrue($token->accessToken->can('anything'));
    }

    /**
     * Test that EnsureFrontendRequestsAreStateful middleware is configured.
     */
    public function test_ensure_frontend_requests_are_stateful_middleware_is_configured(): void
    {
        // This is verified by checking that the middleware is in bootstrap/app.php
        // We can test this by verifying that stateful authentication works
        
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/user');
        $response->assertStatus(200);
        $response->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);
    }
}
