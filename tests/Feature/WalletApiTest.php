<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WalletApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_wallet(): void
    {
        $response = $this->getJson('/api/wallet');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_view_wallet(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create([
            'user_id' => $user->id,
            'balance' => 150.50,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/wallet');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $wallet->id,
                    'balance' => 150.50,
                ],
            ]);
    }

    public function test_authenticated_user_can_view_transaction_history(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);
        
        WalletTransaction::factory()->count(5)->create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/wallet/transactions');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'type',
                        'amount',
                        'description',
                        'balance_after',
                        'created_at',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_transaction_history_can_be_filtered_by_type(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);
        
        WalletTransaction::factory()->count(3)->create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
        ]);
        
        WalletTransaction::factory()->count(2)->create([
            'wallet_id' => $wallet->id,
            'type' => 'debit',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/wallet/transactions?type=credit');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_transaction_history_can_be_filtered_by_date_range(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);
        
        WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'created_at' => '2024-01-15',
        ]);
        
        WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'created_at' => '2024-06-15',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/wallet/transactions?date_from=2024-01-01&date_to=2024-03-31');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_transaction_history_is_paginated(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);
        
        WalletTransaction::factory()->count(60)->create([
            'wallet_id' => $wallet->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/wallet/transactions?per_page=20');

        $response->assertStatus(200);
        $this->assertCount(20, $response->json('data'));
        $this->assertEquals(60, $response->json('meta.total'));
        $this->assertEquals(3, $response->json('meta.last_page'));
    }

    public function test_transactions_are_ordered_by_created_at_descending(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);
        
        $old = WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'created_at' => now()->subDays(2),
        ]);
        
        $recent = WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'created_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/wallet/transactions');

        $response->assertStatus(200);
        $data = $response->json('data');
        
        // First item should be the most recent
        $this->assertEquals($recent->id, $data[0]['id']);
        $this->assertEquals($old->id, $data[1]['id']);
    }
}
