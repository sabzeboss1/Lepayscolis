<?php

namespace Tests\Unit\Middleware;

use App\Http\Middleware\CheckTripOwnership;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Tests\TestCase;

/**
 * Unit tests for CheckTripOwnership middleware
 * 
 * Validates Requirements: 3.15
 */
class CheckTripOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private CheckTripOwnership $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new CheckTripOwnership();
    }

    public function test_allows_trip_owner_to_proceed(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $user->id]);

        $request = Request::create('/api/trips/' . $trip->id, 'PUT');
        $request->setUserResolver(fn() => $user);
        $request->setRouteResolver(function () use ($trip) {
            $route = new \Illuminate\Routing\Route('PUT', '/api/trips/{id}', []);
            $route->bind($request = Request::create('/'));
            $route->setParameter('id', $trip->id);
            return $route;
        });

        $response = $this->middleware->handle($request, function ($req) {
            return new Response('Success', 200);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_blocks_non_owner_from_accessing_trip(): void
    {
        $owner = User::factory()->create(['kyc_status' => 'approved']);
        $nonOwner = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $owner->id]);

        $request = Request::create('/api/trips/' . $trip->id, 'PUT');
        $request->setUserResolver(fn() => $nonOwner);
        $request->setRouteResolver(function () use ($trip) {
            $route = new \Illuminate\Routing\Route('PUT', '/api/trips/{id}', []);
            $route->bind($request = Request::create('/'));
            $route->setParameter('id', $trip->id);
            return $route;
        });

        $response = $this->middleware->handle($request, function ($req) {
            return new Response('Success', 200);
        });

        $this->assertEquals(403, $response->getStatusCode());
        
        $content = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('message', $content);
        $this->assertStringContainsString('Forbidden', $content['message']);
    }

    public function test_returns_404_for_non_existent_trip(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        $nonExistentId = '00000000-0000-0000-0000-000000000000';

        $request = Request::create('/api/trips/' . $nonExistentId, 'PUT');
        $request->setUserResolver(fn() => $user);
        $request->setRouteResolver(function () use ($nonExistentId) {
            $route = new \Illuminate\Routing\Route('PUT', '/api/trips/{id}', []);
            $route->bind($request = Request::create('/'));
            $route->setParameter('id', $nonExistentId);
            return $route;
        });

        $response = $this->middleware->handle($request, function ($req) {
            return new Response('Success', 200);
        });

        $this->assertEquals(404, $response->getStatusCode());
        
        $content = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('message', $content);
        $this->assertEquals('Trip not found', $content['message']);
    }

    public function test_returns_400_when_trip_id_missing(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);

        $request = Request::create('/api/trips/', 'PUT');
        $request->setUserResolver(fn() => $user);
        $request->setRouteResolver(function () {
            $route = new \Illuminate\Routing\Route('PUT', '/api/trips/{id}', []);
            $route->bind($request = Request::create('/'));
            return $route;
        });

        $response = $this->middleware->handle($request, function ($req) {
            return new Response('Success', 200);
        });

        $this->assertEquals(400, $response->getStatusCode());
        
        $content = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('message', $content);
        $this->assertEquals('Trip ID is required', $content['message']);
    }
}
