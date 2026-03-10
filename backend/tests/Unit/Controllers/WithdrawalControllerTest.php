<?php

namespace Tests\Unit\Controllers;

use App\Exceptions\DuplicatePendingWithdrawalException;
use App\Exceptions\InsufficientBalanceException;
use App\Exceptions\InvalidWithdrawalStatusException;
use App\Http\Controllers\WithdrawalController;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WithdrawalRequest;
use App\Services\WithdrawalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Mockery;
use Tests\TestCase;

class WithdrawalControllerTest extends TestCase
{
    use RefreshDatabase;

    private WithdrawalService $withdrawalService;
    private WithdrawalController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->withdrawalService = Mockery::mock(WithdrawalService::class);
        $this->controller = new WithdrawalController($this->withdrawalService);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_store_creates_withdrawal_request(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id, 'balance' => 100.00]);
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'amount' => 50.00,
            'status' => 'pending',
        ]);

        $request = Request::create('/api/withdrawals', 'POST', ['amount' => 50.00]);
        $request->setUserResolver(fn() => $user);

        $this->withdrawalService
            ->shouldReceive('createWithdrawalRequest')
            ->once()
            ->with($user, 50.00)
            ->andReturn($withdrawal);

        $response = $this->controller->store($request);

        $this->assertEquals(201, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertTrue($data['success']);
    }

    public function test_store_handles_duplicate_pending_withdrawal(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id, 'balance' => 100.00]);

        $request = Request::create('/api/withdrawals', 'POST', ['amount' => 50.00]);
        $request->setUserResolver(fn() => $user);

        $this->withdrawalService
            ->shouldReceive('createWithdrawalRequest')
            ->once()
            ->andThrow(new DuplicatePendingWithdrawalException());

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertFalse($data['success']);
    }

    public function test_store_handles_insufficient_balance(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id, 'balance' => 5.00]);

        $request = Request::create('/api/withdrawals', 'POST', ['amount' => 50.00]);
        $request->setUserResolver(fn() => $user);

        $this->withdrawalService
            ->shouldReceive('createWithdrawalRequest')
            ->once()
            ->andThrow(new InsufficientBalanceException(50.00, 5.00));

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertFalse($data['success']);
    }

    public function test_index_returns_user_withdrawals(): void
    {
        $user = User::factory()->create();
        WithdrawalRequest::factory()->count(3)->create(['user_id' => $user->id]);

        $request = Request::create('/api/withdrawals', 'GET');
        $request->setUserResolver(fn() => $user);

        $response = $this->controller->index($request);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertTrue($data['success']);
        $this->assertCount(3, $data['data']);
    }

    public function test_show_returns_withdrawal_for_owner(): void
    {
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create(['user_id' => $user->id]);

        $request = Request::create("/api/withdrawals/{$withdrawal->id}", 'GET');
        $request->setUserResolver(fn() => $user);

        $response = $this->controller->show($request, $withdrawal->id);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertTrue($data['success']);
    }

    public function test_show_returns_404_for_non_owner(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create(['user_id' => $otherUser->id]);

        $request = Request::create("/api/withdrawals/{$withdrawal->id}", 'GET');
        $request->setUserResolver(fn() => $user);

        $response = $this->controller->show($request, $withdrawal->id);

        $this->assertEquals(404, $response->getStatusCode());
    }

    public function test_cancel_cancels_pending_withdrawal(): void
    {
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $request = Request::create("/api/withdrawals/{$withdrawal->id}", 'DELETE');
        $request->setUserResolver(fn() => $user);

        $this->withdrawalService
            ->shouldReceive('cancelWithdrawal')
            ->once()
            ->with(Mockery::type(WithdrawalRequest::class))
            ->andReturn($withdrawal);

        $response = $this->controller->cancel($request, $withdrawal->id);

        $this->assertEquals(204, $response->getStatusCode());
    }

    public function test_cancel_handles_invalid_status(): void
    {
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'approved',
        ]);

        $request = Request::create("/api/withdrawals/{$withdrawal->id}", 'DELETE');
        $request->setUserResolver(fn() => $user);

        $this->withdrawalService
            ->shouldReceive('cancelWithdrawal')
            ->once()
            ->andThrow(new InvalidWithdrawalStatusException('approved', 'cancelled'));

        $response = $this->controller->cancel($request, $withdrawal->id);

        $this->assertEquals(422, $response->getStatusCode());
    }
}
