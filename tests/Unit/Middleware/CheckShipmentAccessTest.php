<?php

namespace Tests\Unit\Middleware;

use App\Http\Middleware\CheckShipmentAccess;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * CheckShipmentAccessTest - Test shipment access middleware
 * 
 * Tests:
 * - Sender can access shipment
 * - Traveler can access shipment
 * - Other users cannot access shipment
 * - Unauthenticated users cannot access shipment
 * 
 * Validates Requirements: 4.17-4.18
 */
class CheckShipmentAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_sender_can_access_shipment(): void
    {
        $sender = User::factory()->create();
        $shipment = Shipment::factory()->create(['sender_id' => $sender->id]);

        $request = Request::create('/api/shipments/' . $shipment->id, 'GET');
        $request->setUserResolver(fn() => $sender);
        $request->setRouteResolver(function () use ($shipment) {
            $route = new \Illuminate\Routing\Route('GET', '/api/shipments/{id}', []);
            $route->bind($request = Request::create('/'));
            $route->setParameter('id', $shipment->id);
            return $route;
        });

        $middleware = new CheckShipmentAccess();
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_traveler_can_access_shipment(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $shipment = Shipment::factory()->create(['traveler_id' => $traveler->id]);

        $request = Request::create('/api/shipments/' . $shipment->id, 'GET');
        $request->setUserResolver(fn() => $traveler);
        $request->setRouteResolver(function () use ($shipment) {
            $route = new \Illuminate\Routing\Route('GET', '/api/shipments/{id}', []);
            $route->bind($request = Request::create('/'));
            $route->setParameter('id', $shipment->id);
            return $route;
        });

        $middleware = new CheckShipmentAccess();
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_other_users_cannot_access_shipment(): void
    {
        $sender = User::factory()->create();
        $otherUser = User::factory()->create();
        $shipment = Shipment::factory()->create(['sender_id' => $sender->id]);

        $request = Request::create('/api/shipments/' . $shipment->id, 'GET');
        $request->setUserResolver(fn() => $otherUser);
        $request->setRouteResolver(function () use ($shipment) {
            $route = new \Illuminate\Routing\Route('GET', '/api/shipments/{id}', []);
            $route->bind($request = Request::create('/'));
            $route->setParameter('id', $shipment->id);
            return $route;
        });

        $middleware = new CheckShipmentAccess();
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals('You do not have access to this shipment.', $data['message']);
    }

    public function test_unauthenticated_users_cannot_access_shipment(): void
    {
        $shipment = Shipment::factory()->create();

        $request = Request::create('/api/shipments/' . $shipment->id, 'GET');
        $request->setUserResolver(fn() => null);
        $request->setRouteResolver(function () use ($shipment) {
            $route = new \Illuminate\Routing\Route('GET', '/api/shipments/{id}', []);
            $route->bind($request = Request::create('/'));
            $route->setParameter('id', $shipment->id);
            return $route;
        });

        $middleware = new CheckShipmentAccess();
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(401, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals('Unauthenticated.', $data['message']);
    }

    public function test_returns_404_for_nonexistent_shipment(): void
    {
        $user = User::factory()->create();

        $request = Request::create('/api/shipments/00000000-0000-0000-0000-000000000000', 'GET');
        $request->setUserResolver(fn() => $user);
        $request->setRouteResolver(function () {
            $route = new \Illuminate\Routing\Route('GET', '/api/shipments/{id}', []);
            $route->bind($request = Request::create('/'));
            $route->setParameter('id', '00000000-0000-0000-0000-000000000000');
            return $route;
        });

        $middleware = new CheckShipmentAccess();
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(404, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals('Shipment not found.', $data['message']);
    }
}
