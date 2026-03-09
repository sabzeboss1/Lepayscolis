<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use App\Models\WalletAuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Phase 1 Checkpoint Test: Database Foundation Complete
 * 
 * This test verifies that all Phase 1 tasks are complete:
 * - Task 1: All migrations run successfully
 * - Task 2: All models and relationships work correctly
 * - Task 3: UserObserver creates wallets automatically
 */
class WalletPhase1CheckpointTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that all wallet tables exist with correct structure.
     */
    public function test_all_wallet_tables_exist_with_correct_structure(): void
    {
        // Verify all tables exist
        $this->assertTrue(Schema::hasTable('wallets'));
        $this->assertTrue(Schema::hasTable('wallet_transactions'));
        $this->assertTrue(Schema::hasTable('withdrawal_requests'));
        $this->assertTrue(Schema::hasTable('wallet_audit_logs'));

        // Verify wallets table structure
        $this->assertTrue(Schema::hasColumns('wallets', [
            'id', 'user_id', 'balance', 'created_at', 'updated_at'
        ]));

        // Verify wallet_transactions table structure
        $this->assertTrue(Schema::hasColumns('wallet_transactions', [
            'id', 'wallet_id', 'type', 'amount', 'description',
            'reference_type', 'reference_id', 'balance_after', 'created_at'
        ]));

        // Verify withdrawal_requests table structure
        $this->assertTrue(Schema::hasColumns('withdrawal_requests', [
            'id', 'user_id', 'amount', 'fee', 'net_amount', 'status',
            'rejection_reason', 'approved_by', 'approved_at', 'completed_at',
            'created_at', 'updated_at'
        ]));

        // Verify wallet_audit_logs table structure
        $this->assertTrue(Schema::hasColumns('wallet_audit_logs', [
            'id', 'admin_id', 'action', 'target_type', 'target_id',
            'reason', 'metadata', 'created_at'
        ]));
    }

    /**
     * Test that UserObserver automatically creates wallet on user registration.
     */
    public function test_user_observer_creates_wallet_automatically(): void
    {
        // Create a new user
        $user = User::factory()->create();

        // Verify wallet was created automatically
        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
            'balance' => '0.00',
        ]);

        // Verify user has wallet relationship
        $this->assertInstanceOf(Wallet::class, $user->wallet);
        $this->assertEquals('0.00', $user->wallet->balance);
    }

    /**
     * Test that Wallet model has correct relationships.
     */
    public function test_wallet_model_relationships_work(): void
    {
        $user = User::factory()->create();
        $wallet = $user->wallet; // Get auto-created wallet

        // Test wallet belongs to user
        $this->assertInstanceOf(User::class, $wallet->user);
        $this->assertEquals($user->id, $wallet->user->id);

        // Test wallet has many transactions (empty initially)
        $this->assertCount(0, $wallet->transactions);

        // Create a transaction
        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50.00,
            'description' => 'Test credit',
            'balance_after' => 50.00,
        ]);

        // Refresh and verify relationship
        $wallet->refresh();
        $this->assertCount(1, $wallet->transactions);
        $this->assertEquals($transaction->id, $wallet->transactions->first()->id);
    }

    /**
     * Test that WalletTransaction model works correctly.
     */
    public function test_wallet_transaction_model_works(): void
    {
        $user = User::factory()->create();
        $wallet = $user->wallet;

        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 100.00,
            'description' => 'Payment for shipment',
            'reference_type' => 'shipment',
            'reference_id' => 'test-123',
            'balance_after' => 100.00,
        ]);

        $this->assertInstanceOf(WalletTransaction::class, $transaction);
        $this->assertEquals('credit', $transaction->type);
        $this->assertEquals('100.00', $transaction->amount);
        $this->assertEquals('100.00', $transaction->balance_after);
        $this->assertEquals('shipment', $transaction->reference_type);
        $this->assertEquals('test-123', $transaction->reference_id);

        // Verify no updated_at column
        $this->assertNull($transaction->updated_at);
    }

    /**
     * Test that WithdrawalRequest model works correctly.
     */
    public function test_withdrawal_request_model_works(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);

        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 50.00,
            'fee' => 2.00,
            'net_amount' => 48.00,
            'status' => 'pending',
        ]);

        $this->assertInstanceOf(WithdrawalRequest::class, $withdrawal);
        $this->assertEquals('50.00', $withdrawal->amount);
        $this->assertEquals('2.00', $withdrawal->fee);
        $this->assertEquals('48.00', $withdrawal->net_amount);
        $this->assertEquals('pending', $withdrawal->status);

        // Test user relationship
        $this->assertInstanceOf(User::class, $withdrawal->user);
        $this->assertEquals($user->id, $withdrawal->user->id);

        // Test approver relationship (null initially)
        $this->assertNull($withdrawal->approver);

        // Update with approver
        $withdrawal->update(['approved_by' => $admin->id]);
        $withdrawal->refresh();
        $this->assertInstanceOf(User::class, $withdrawal->approver);
        $this->assertEquals($admin->id, $withdrawal->approver->id);
    }

    /**
     * Test that WalletAuditLog model works correctly.
     */
    public function test_wallet_audit_log_model_works(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();

        $auditLog = WalletAuditLog::create([
            'admin_id' => $admin->id,
            'action' => 'balance_adjusted',
            'target_type' => 'wallet',
            'target_id' => $user->wallet->id,
            'reason' => 'Manual adjustment for testing',
            'metadata' => json_encode(['amount' => 10.00]),
        ]);

        $this->assertInstanceOf(WalletAuditLog::class, $auditLog);
        $this->assertEquals('balance_adjusted', $auditLog->action);
        $this->assertEquals('wallet', $auditLog->target_type);
        $this->assertEquals('Manual adjustment for testing', $auditLog->reason);

        // Test admin relationship
        $this->assertInstanceOf(User::class, $auditLog->admin);
        $this->assertEquals($admin->id, $auditLog->admin->id);

        // Verify no updated_at column
        $this->assertNull($auditLog->updated_at);
    }

    /**
     * Test that User model has all wallet relationships.
     */
    public function test_user_model_has_wallet_relationships(): void
    {
        $user = User::factory()->create();

        // Test hasOne wallet relationship
        $this->assertInstanceOf(Wallet::class, $user->wallet);

        // Test hasMany withdrawalRequests relationship
        $this->assertCount(0, $user->withdrawalRequests);

        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 50.00,
            'fee' => 0.00,
            'net_amount' => 50.00,
            'status' => 'pending',
        ]);

        $user->refresh();
        $this->assertCount(1, $user->withdrawalRequests);
        $this->assertEquals($withdrawal->id, $user->withdrawalRequests->first()->id);

        // Test hasManyThrough walletTransactions relationship
        $this->assertCount(0, $user->walletTransactions);

        $transaction = WalletTransaction::create([
            'wallet_id' => $user->wallet->id,
            'type' => 'credit',
            'amount' => 25.00,
            'description' => 'Test transaction',
            'balance_after' => 25.00,
        ]);

        $user->refresh();
        $this->assertCount(1, $user->walletTransactions);
        $this->assertEquals($transaction->id, $user->walletTransactions->first()->id);
    }

    /**
     * Test that wallet balance maintains 2 decimal precision.
     */
    public function test_wallet_balance_precision(): void
    {
        $user = User::factory()->create();
        $wallet = $user->wallet;

        // Update balance with various values
        $wallet->update(['balance' => 100.5]);
        $wallet->refresh();
        $this->assertEquals('100.50', $wallet->balance);

        $wallet->update(['balance' => 99.999]);
        $wallet->refresh();
        $this->assertEquals('100.00', $wallet->balance);

        $wallet->update(['balance' => 0]);
        $wallet->refresh();
        $this->assertEquals('0.00', $wallet->balance);
    }

    /**
     * Test that one-to-one wallet-user relationship is enforced.
     */
    public function test_wallet_user_unique_constraint(): void
    {
        $user = User::factory()->create();

        // First wallet created automatically by observer
        $this->assertDatabaseHas('wallets', ['user_id' => $user->id]);

        // Attempting to create second wallet should fail
        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);

        Wallet::create([
            'user_id' => $user->id,
            'balance' => 50.00,
        ]);
    }

    /**
     * Test that all models use UUIDs.
     */
    public function test_all_models_use_uuids(): void
    {
        $user = User::factory()->create();
        $wallet = $user->wallet;

        // Create test records
        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 10.00,
            'description' => 'Test',
            'balance_after' => 10.00,
        ]);

        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 5.00,
            'fee' => 0.00,
            'net_amount' => 5.00,
            'status' => 'pending',
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $auditLog = WalletAuditLog::create([
            'admin_id' => $admin->id,
            'action' => 'test',
            'target_type' => 'wallet',
            'target_id' => $wallet->id,
            'reason' => 'Test',
        ]);

        // Verify all IDs are UUIDs (36 characters with dashes)
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $wallet->id
        );
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $transaction->id
        );
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $withdrawal->id
        );
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $auditLog->id
        );
    }
}
