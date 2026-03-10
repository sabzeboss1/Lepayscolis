<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WithdrawalRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WithdrawalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_create_withdrawal(): void
    {
        $response = $this->postJson('/api/withdrawals', ['amount' => 50.00]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_create_withdrawal_request(): void
    {
        $user = User::factory()->create();
        Wallet::factory()->create([
            'user_id' => $user->id,
            'balance' => 100.00,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/withdrawals', [
            'amount' => 50.00,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'amount',
                    'fee',
                    'net_amount',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('withdrawal_requests', [
            'user_id' => $user->id,
            'amount' => 50.00,
            'status' => 'pending',
        ]);
    }

    public function test_withdrawal_amount_must_be_at_least_10_eur(): void
    {
        $user = User::factory()->create();
        Wallet::factory()->create([
            'user_id' => $user->id,
            'balance' => 100.00,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/withdrawals', [
            'amount' => 5.00,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_withdrawal_amount_cannot_exceed_balance(): void
    {
        $user = User::factory()->create();
        Wallet::factory()->create([
            'user_id' => $user->id,
            'balance' => 50.00,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/withdrawals', [
            'amount' => 100.00,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_user_cannot_create_duplicate_pending_withdrawal(): void
    {
        $user = User::factory()->create();
        Wallet::factory()->create([
            'user_id' => $user->id,
            'balance' => 200.00,
        ]);

        WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/withdrawals', [
            'amount' => 50.00,
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_view_their_withdrawal_requests(): void
    {
        $user = User::factory()->create();
        WithdrawalRequest::factory()->count(3)->create([
            'user_id' => $user->id,
        ]);

        // Create withdrawal for another user (should not be visible)
        $otherUser = User::factory()->create();
        WithdrawalRequest::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/withdrawals');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertCount(3, $response->json('data'));
    }

    public function test_user_can_filter_withdrawals_by_status(): void
    {
        $user = User::factory()->create();
        
        WithdrawalRequest::factory()->count(2)->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        
        WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'completed',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/withdrawals?status=pending');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_can_view_specific_withdrawal(): void
    {
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/withdrawals/{$withdrawal->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $withdrawal->id,
                ],
            ]);
    }

    public function test_user_cannot_view_other_users_withdrawal(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/withdrawals/{$withdrawal->id}");

        $response->assertStatus(404);
    }

    public function test_user_can_cancel_pending_withdrawal(): void
    {
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/withdrawals/{$withdrawal->id}");

        $response->assertStatus(204);

        $this->assertDatabaseHas('withdrawal_requests', [
            'id' => $withdrawal->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_user_cannot_cancel_approved_withdrawal(): void
    {
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'approved',
        ]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/withdrawals/{$withdrawal->id}");

        $response->assertStatus(422);
    }

    public function test_user_cannot_cancel_other_users_withdrawal(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $otherUser->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/withdrawals/{$withdrawal->id}");

        $response->assertStatus(404);
    }
}
