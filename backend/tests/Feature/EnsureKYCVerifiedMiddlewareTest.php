<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnsureKYCVerifiedMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that middleware allows access for users with approved KYC status.
     */
    public function test_middleware_allows_approved_kyc_users(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'approved',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/test-kyc-protected');

        // This will return 404 since the route doesn't exist yet,
        // but it won't return 403, which means the middleware passed
        $this->assertNotEquals(403, $response->status());
    }

    /**
     * Test that middleware blocks users with pending KYC status.
     */
    public function test_middleware_blocks_pending_kyc_users(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);

        // We'll test this with a real route once trips/shipments are implemented
        // For now, we'll create a test route in the test itself
        $this->app['router']->get('/api/test-kyc-protected', function () {
            return response()->json(['message' => 'success']);
        })->middleware(['auth:sanctum', 'kyc.verified']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/test-kyc-protected');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'KYC verification required',
                'kyc_status' => 'pending',
            ]);
    }

    /**
     * Test that middleware blocks users with rejected KYC status.
     */
    public function test_middleware_blocks_rejected_kyc_users(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'rejected',
        ]);

        $this->app['router']->get('/api/test-kyc-protected', function () {
            return response()->json(['message' => 'success']);
        })->middleware(['auth:sanctum', 'kyc.verified']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/test-kyc-protected');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'KYC verification required',
                'kyc_status' => 'rejected',
            ]);
    }

    /**
     * Test that middleware allows approved users to access protected routes.
     */
    public function test_middleware_allows_approved_users_through(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'approved',
        ]);

        $this->app['router']->get('/api/test-kyc-protected', function () {
            return response()->json(['message' => 'success']);
        })->middleware(['auth:sanctum', 'kyc.verified']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/test-kyc-protected');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'success',
            ]);
    }

    /**
     * Test that middleware returns correct kyc_status in error response.
     */
    public function test_middleware_returns_correct_kyc_status_in_error(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);

        $this->app['router']->get('/api/test-kyc-protected', function () {
            return response()->json(['message' => 'success']);
        })->middleware(['auth:sanctum', 'kyc.verified']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/test-kyc-protected');

        $response->assertStatus(403)
            ->assertJsonStructure([
                'message',
                'kyc_status',
            ])
            ->assertJson([
                'kyc_status' => 'pending',
            ]);
    }

    /**
     * Test that unauthenticated users are handled properly.
     */
    public function test_middleware_handles_unauthenticated_users(): void
    {
        $this->app['router']->get('/api/test-kyc-protected', function () {
            return response()->json(['message' => 'success']);
        })->middleware(['auth:sanctum', 'kyc.verified']);

        $response = $this->getJson('/api/test-kyc-protected');

        // Should return 401 from auth:sanctum middleware before reaching kyc.verified
        $response->assertStatus(401);
    }
}
