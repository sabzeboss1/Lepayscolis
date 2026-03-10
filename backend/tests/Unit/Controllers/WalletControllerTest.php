<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\WalletController;
use App\Http\Resources\WalletResource;
use App\Http\Resources\WalletTransactionResource;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class WalletControllerTest extends TestCase
{
    use RefreshDatabase;

    private WalletService $walletService;
    private WalletController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->walletService = Mockery::mock(WalletService::class);
        $this->controller = new WalletController($this->walletService);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_show_returns_user_wallet(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);

        $request = Request::create('/api/wallet', 'GET');
        $request->setUserResolver(fn() => $user);

        $this->walletService
            ->shouldReceive('getWallet')
            ->once()
            ->with($user)
            ->andReturn($wallet);

        $response = $this->controller->show($request);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('data', $data);
    }

    public function test_transactions_returns_paginated_history(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);
        
        $transactions = WalletTransaction::factory()->count(3)->create([
            'wallet_id' => $wallet->id,
        ]);

        $paginator = new LengthAwarePaginator(
            $transactions,
            3,
            50,
            1
        );

        $request = Request::create('/api/wallet/transactions', 'GET', [
            'type' => 'credit',
            'per_page' => 50,
        ]);
        $request->setUserResolver(fn() => $user);

        $this->walletService
            ->shouldReceive('getWallet')
            ->once()
            ->with($user)
            ->andReturn($wallet);

        $this->walletService
            ->shouldReceive('getTransactionHistory')
            ->once()
            ->with($wallet, Mockery::type('array'))
            ->andReturn($paginator);

        $response = $this->controller->transactions($request);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('meta', $data);
        $this->assertEquals(3, $data['meta']['total']);
    }

    public function test_transactions_applies_filters(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);

        $paginator = new LengthAwarePaginator([], 0, 50, 1);

        $request = Request::create('/api/wallet/transactions', 'GET', [
            'type' => 'debit',
            'date_from' => '2024-01-01',
            'date_to' => '2024-12-31',
            'per_page' => 25,
        ]);
        $request->setUserResolver(fn() => $user);

        $this->walletService
            ->shouldReceive('getWallet')
            ->once()
            ->andReturn($wallet);

        $this->walletService
            ->shouldReceive('getTransactionHistory')
            ->once()
            ->with($wallet, [
                'type' => 'debit',
                'date_from' => '2024-01-01',
                'date_to' => '2024-12-31',
                'per_page' => 25,
            ])
            ->andReturn($paginator);

        $response = $this->controller->transactions($request);

        $this->assertEquals(200, $response->getStatusCode());
    }
}
