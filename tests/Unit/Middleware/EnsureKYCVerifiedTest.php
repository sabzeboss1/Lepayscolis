<?php

namespace Tests\Unit\Middleware;

use App\Http\Middleware\EnsureKYCVerified;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Tests\TestCase;

class EnsureKYCVerifiedTest extends TestCase
{
    use RefreshDatabase;

    private EnsureKYCVerified $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new EnsureKYCVerified();
    }

    /**
     * Test middleware allows users with approved KYC status.
     */
    public function test_allows_users_with_approved_kyc(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'approved',
        ]);

        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn() => $user);

        $next = function ($request) {
            return new Response('Success', 200);
        };

        $response = $this->middleware->handle($request, $next);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('Success', $response->getContent());
    }

    /**
     * Test middleware blocks users with pending KYC status.
     */
    public function test_blocks_users_with_pending_kyc(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);

        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn() => $user);

        $next = function ($request) {
            return new Response('Success', 200);
        };

        $response = $this->middleware->handle($request, $next);

        $this->assertEquals(403, $response->getStatusCode());
        
        $content = json_decode($response->getContent(), true);
        $this->assertEquals('KYC verification required', $content['message']);
        $this->assertEquals('pending', $content['kyc_status']);
    }

    /**
     * Test middleware blocks users with rejected KYC status.
     */
    public function test_blocks_users_with_rejected_kyc(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'rejected',
        ]);

        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn() => $user);

        $next = function ($request) {
            return new Response('Success', 200);
        };

        $response = $this->middleware->handle($request, $next);

        $this->assertEquals(403, $response->getStatusCode());
        
        $content = json_decode($response->getContent(), true);
        $this->assertEquals('KYC verification required', $content['message']);
        $this->assertEquals('rejected', $content['kyc_status']);
    }

    /**
     * Test middleware handles null user (unauthenticated).
     */
    public function test_handles_null_user(): void
    {
        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn() => null);

        $next = function ($request) {
            return new Response('Success', 200);
        };

        $response = $this->middleware->handle($request, $next);

        $this->assertEquals(403, $response->getStatusCode());
        
        $content = json_decode($response->getContent(), true);
        $this->assertEquals('KYC verification required', $content['message']);
        $this->assertEquals('pending', $content['kyc_status']);
    }

    /**
     * Test middleware returns JSON response with correct structure.
     */
    public function test_returns_json_response_with_correct_structure(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);

        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn() => $user);

        $next = function ($request) {
            return new Response('Success', 200);
        };

        $response = $this->middleware->handle($request, $next);

        $this->assertEquals('application/json', $response->headers->get('Content-Type'));
        
        $content = json_decode($response->getContent(), true);
        $this->assertIsArray($content);
        $this->assertArrayHasKey('message', $content);
        $this->assertArrayHasKey('kyc_status', $content);
    }

    /**
     * Test middleware does not modify request for approved users.
     */
    public function test_does_not_modify_request_for_approved_users(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'approved',
        ]);

        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn() => $user);

        $passedRequest = null;
        $next = function ($request) use (&$passedRequest) {
            $passedRequest = $request;
            return new Response('Success', 200);
        };

        $this->middleware->handle($request, $next);

        $this->assertSame($request, $passedRequest);
    }
}
