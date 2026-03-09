<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletAuditLog;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletModelsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Wallet model creation and relationships.
     */
    public function test_wallet_model_has_correct_fillable_fields(): void
    {
        $user = User::factory()->create();
        
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 100.50,
        ]);

        $this->assertInstanceOf(Wallet::class, $wallet);
        $this->assertEquals(100.50, $wallet->balance);
        $this->assertEquals($user->id, $wallet->user_id);
    }

    /**
     * Test Wallet balance is cast to decimal with 2 places.
     */
    public function test_wallet_balance_cast_to_decimal(): void
    {
        $user = User::factory()->create();
        
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 100.5,
        ]);

        $this->assertIsString($wallet->balance);
        $this->assertEquals('100.50', $wallet->balance);
    }

    /**
     * Test Wallet belongs to User relationship.
     */
    public function test_wallet_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 0,
        ]);

        $this->assertInstanceOf(User::class, $wallet->user);
        $this->assertEquals($user->id, $wallet->user->id);
    }

    /**
     * Test Wallet has many transactions relationship.
     */
    public function test_wallet_has_many_transactions(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 100,
        ]);

        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50.00,
            'description' => 'Test credit',
            'balance_after' => 150.00,
        ]);

        $this->assertCount(1, $wallet->transactions);
        $this->assertEquals($transaction->id, $wallet->transactions->first()->id);
    }

    /**
     * Test WalletTransaction model creation.
     */
    public function test_wallet_transaction_model_has_correct_fillable_fields(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 0,
        ]);

        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 75.25,
            'description' => 'Payment for shipment',
            'reference_type' => 'shipment',
            'reference_id' => 'test-id',
            'balance_after' => 75.25,
        ]);

        $this->assertInstanceOf(WalletTransaction::class, $transaction);
        $this->assertEquals('credit', $transaction->type);
        $this->assertEquals('75.25', $transaction->amount);
        $this->assertEquals('75.25', $transaction->balance_after);
    }

    /**
     * Test WalletTransaction does not have updated_at.
     */
    public function test_wallet_transaction_has_no_updated_at(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 0,
        ]);

        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50.00,
            'description' => 'Test',
            'balance_after' => 50.00,
        ]);

        $this->assertNull($transaction->updated_at);
    }

    /**
     * Test WithdrawalRequest model creation.
     */
    public function test_withdrawal_request_model_has_correct_fillable_fields(): void
    {
        $user = User::factory()->create();

        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 100.00,
            'fee' => 5.00,
            'net_amount' => 95.00,
            'status' => 'pending',
        ]);

        $this->assertInstanceOf(WithdrawalRequest::class, $withdrawal);
        $this->assertEquals('100.00', $withdrawal->amount);
        $this->assertEquals('5.00', $withdrawal->fee);
        $this->assertEquals('95.00', $withdrawal->net_amount);
        $this->assertEquals('pending', $withdrawal->status);
    }

    /**
     * Test WithdrawalRequest belongs to User.
     */
    public function test_withdrawal_request_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 100.00,
            'fee' => 0,
            'net_amount' => 100.00,
            'status' => 'pending',
        ]);

        $this->assertInstanceOf(User::class, $withdrawal->user);
        $this->assertEquals($user->id, $withdrawal->user->id);
    }

    /**
     * Test WithdrawalRequest belongs to approver.
     */
    public function test_withdrawal_request_belongs_to_approver(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 100.00,
            'fee' => 0,
            'net_amount' => 100.00,
            'status' => 'approved',
            'approved_by' => $admin->id,
        ]);

        $this->assertInstanceOf(User::class, $withdrawal->approver);
        $this->assertEquals($admin->id, $withdrawal->approver->id);
    }

    /**
     * Test WalletAuditLog model creation.
     */
    public function test_wallet_audit_log_model_has_correct_fillable_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $auditLog = WalletAuditLog::create([
            'admin_id' => $admin->id,
            'action' => 'balance_adjusted',
            'target_type' => 'wallet',
            'target_id' => 'test-wallet-id',
            'reason' => 'Manual adjustment for testing',
            'metadata' => ['amount' => 50.00],
        ]);

        $this->assertInstanceOf(WalletAuditLog::class, $auditLog);
        $this->assertEquals('balance_adjusted', $auditLog->action);
        $this->assertEquals('wallet', $auditLog->target_type);
        $this->assertIsArray($auditLog->metadata);
        $this->assertEquals(50.00, $auditLog->metadata['amount']);
    }

    /**
     * Test WalletAuditLog does not have updated_at.
     */
    public function test_wallet_audit_log_has_no_updated_at(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $auditLog = WalletAuditLog::create([
            'admin_id' => $admin->id,
            'action' => 'test_action',
            'target_type' => 'wallet',
            'target_id' => 'test-id',
            'reason' => 'Test reason',
        ]);

        $this->assertNull($auditLog->updated_at);
    }

    /**
     * Test User has one Wallet relationship.
     */
    public function test_user_has_one_wallet(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 0,
        ]);

        $this->assertInstanceOf(Wallet::class, $user->wallet);
        $this->assertEquals($wallet->id, $user->wallet->id);
    }

    /**
     * Test User has many withdrawal requests.
     */
    public function test_user_has_many_withdrawal_requests(): void
    {
        $user = User::factory()->create();
        
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 100.00,
            'fee' => 0,
            'net_amount' => 100.00,
            'status' => 'pending',
        ]);

        $this->assertCount(1, $user->withdrawalRequests);
        $this->assertEquals($withdrawal->id, $user->withdrawalRequests->first()->id);
    }

    /**
     * Test User has many wallet transactions through wallet.
     */
    public function test_user_has_many_wallet_transactions_through_wallet(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'balance' => 0,
        ]);

        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50.00,
            'description' => 'Test',
            'balance_after' => 50.00,
        ]);

        $this->assertCount(1, $user->walletTransactions);
        $this->assertEquals($transaction->id, $user->walletTransactions->first()->id);
    }

    /**
     * Test User isAdmin method works correctly.
     */
    public function test_user_is_admin_method(): void
    {
        $regularUser = User::factory()->create(['role' => 'user']);
        $admin = User::factory()->create(['role' => 'admin']);
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->assertFalse($regularUser->isAdmin());
        $this->assertTrue($admin->isAdmin());
        $this->assertTrue($superAdmin->isAdmin());
    }
}
