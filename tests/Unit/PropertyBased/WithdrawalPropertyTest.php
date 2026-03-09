<?php

namespace Tests\Unit\PropertyBased;

use App\Exceptions\DuplicatePendingWithdrawalException;
use App\Exceptions\InvalidWithdrawalStatusException;
use App\Exceptions\MinimumWithdrawalException;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Services\WalletService;
use App\Services\WithdrawalService;
use Eris\Generator;
use Eris\TestTrait;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Property-based tests for withdrawal system.
 * 
 * These tests validate universal properties that should hold for all valid inputs
 * in the withdrawal system, including withdrawal validation, status transitions,
 * and wallet debits.
 * 
 * Feature: wallet-withdrawals-system
 */
class WithdrawalPropertyTest extends TestCase
{
    use TestTrait, RefreshDatabase;

    /**
     * Property 18: Withdrawal amount validation
     * 
     * For any withdrawal request, amount should be at least 10 EUR
     * and not exceed available balance.
     * 
     * **Validates: Requirements 4.1, 4.2, 4.3**
     */
    public function testProperty18WithdrawalAmountValidation()
    {
        $this->forAll(
            Generator\choose(0, 2000),  // Requested amount in cents
            Generator\choose(1000, 10000)  // Wallet balance in cents
        )->then(function ($requestedAmountInCents, $balanceInCents) {
            // Create user with wallet
            $user = User::factory()->create();
            $wallet = $user->wallet;

            // Set wallet balance
            $balance = $balanceInCents / 100;
            $wallet->update(['balance' => $balance]);

            $requestedAmount = $requestedAmountInCents / 100;
            $minimumAmount = config('wallet.minimum_withdrawal', 10.00);

            $withdrawalService = app(WithdrawalService::class);

            // Property: Amount below minimum should throw MinimumWithdrawalException
            if ($requestedAmount < $minimumAmount) {
                $this->expectException(MinimumWithdrawalException::class);
                $withdrawalService->validateWithdrawalRequest($user, $requestedAmount);
            }
            // Property: Amount exceeding balance should throw InsufficientBalanceException
            elseif ($requestedAmount > $balance) {
                $this->expectException(\App\Exceptions\InsufficientBalanceException::class);
                $withdrawalService->validateWithdrawalRequest($user, $requestedAmount);
            }
            // Property: Valid amount should pass validation
            else {
                $withdrawalService->validateWithdrawalRequest($user, $requestedAmount);
                $this->assertTrue(true, 'Valid withdrawal amount should pass validation');
            }
        });
    }

    /**
     * Property 21: Single pending withdrawal constraint
     * 
     * For any user with a pending withdrawal, creating another should fail.
     * 
     * **Validates: Requirements 4.7**
     */
    public function testProperty21SinglePendingWithdrawalConstraint()
    {
        $this->forAll(
            Generator\choose(1000, 5000),  // First withdrawal amount in cents
            Generator\choose(1000, 5000)   // Second withdrawal amount in cents
        )->then(function ($firstAmountInCents, $secondAmountInCents) {
            // Create user with sufficient balance
            $user = User::factory()->create();
            $wallet = $user->wallet;
            $wallet->update(['balance' => 10000.00]);

            $firstAmount = $firstAmountInCents / 100;
            $secondAmount = $secondAmountInCents / 100;

            $withdrawalService = app(WithdrawalService::class);

            // Create first pending withdrawal
            $firstWithdrawal = $withdrawalService->createWithdrawalRequest($user, $firstAmount);

            // Property: First withdrawal should be created with status pending
            $this->assertEquals('pending', $firstWithdrawal->status,
                'First withdrawal should have pending status');

            // Property: Attempting to create second pending withdrawal should fail
            $this->expectException(DuplicatePendingWithdrawalException::class);
            $withdrawalService->createWithdrawalRequest($user, $secondAmount);
        });
    }

    /**
     * Property 27: Withdrawal status progression
     * 
     * For any withdrawal, valid transitions are:
     * pending→approved→processing→completed.
     * 
     * **Validates: Requirements 6.1, 6.2**
     */
    public function testProperty27WithdrawalStatusProgression()
    {
        $this->forAll(
            Generator\choose(1000, 5000)  // Withdrawal amount in cents
        )->then(function ($amountInCents) {
            // Create user and admin with sufficient balance
            $user = User::factory()->create();
            $admin = User::factory()->create(['role' => 'admin']);
            $wallet = $user->wallet;
            $wallet->update(['balance' => 10000.00]);

            $amount = $amountInCents / 100;

            $withdrawalService = app(WithdrawalService::class);

            // Create withdrawal request
            $withdrawal = $withdrawalService->createWithdrawalRequest($user, $amount);

            // Property: Initial status should be pending
            $this->assertEquals('pending', $withdrawal->status,
                'Initial status should be pending');

            // Property: Can transition from pending to approved
            $this->assertTrue(
                $withdrawalService->canTransitionTo($withdrawal, 'approved'),
                'Should be able to transition from pending to approved'
            );

            // Approve withdrawal
            $withdrawal = $withdrawalService->approveWithdrawal($withdrawal, $admin);
            $this->assertEquals('approved', $withdrawal->status,
                'Status should be approved after approval');

            // Property: Can transition from approved to processing
            $this->assertTrue(
                $withdrawalService->canTransitionTo($withdrawal, 'processing'),
                'Should be able to transition from approved to processing'
            );

            // Mark as processing
            $withdrawal = $withdrawalService->markProcessing($withdrawal, $admin);
            $this->assertEquals('processing', $withdrawal->status,
                'Status should be processing');

            // Property: Can transition from processing to completed
            $this->assertTrue(
                $withdrawalService->canTransitionTo($withdrawal, 'completed'),
                'Should be able to transition from processing to completed'
            );

            // Complete withdrawal
            $withdrawal = $withdrawalService->completeWithdrawal($withdrawal, $admin);
            $this->assertEquals('completed', $withdrawal->status,
                'Status should be completed');

            // Property: Cannot transition from completed to any other status
            $this->assertFalse(
                $withdrawalService->canTransitionTo($withdrawal, 'pending'),
                'Should not be able to transition from completed'
            );
        });
    }

    /**
     * Property 28: Withdrawal completion with wallet debit
     * 
     * For any withdrawal completing, a debit transaction should be created
     * and balance decreased by amount + fee.
     * 
     * **Validates: Requirements 6.3, 6.4, 6.5**
     */
    public function testProperty28WithdrawalCompletionWithWalletDebit()
    {
        $this->forAll(
            Generator\choose(1000, 5000)  // Withdrawal amount in cents
        )->then(function ($amountInCents) {
            // Create user and admin with sufficient balance
            $user = User::factory()->create();
            $admin = User::factory()->create(['role' => 'admin']);
            $wallet = $user->wallet;
            
            $initialBalance = 10000.00;
            $wallet->update(['balance' => $initialBalance]);

            $amount = $amountInCents / 100;

            $withdrawalService = app(WithdrawalService::class);

            // Create and approve withdrawal
            $withdrawal = $withdrawalService->createWithdrawalRequest($user, $amount);
            $withdrawal = $withdrawalService->approveWithdrawal($withdrawal, $admin);
            $withdrawal = $withdrawalService->markProcessing($withdrawal, $admin);

            // Store expected values
            $fee = $withdrawal->fee;
            $totalDebit = $amount + $fee;
            $expectedBalance = $initialBalance - $totalDebit;

            // Complete withdrawal
            $withdrawal = $withdrawalService->completeWithdrawal($withdrawal, $admin);

            // Property: Withdrawal status should be completed
            $this->assertEquals('completed', $withdrawal->status,
                'Withdrawal status should be completed');

            // Property: Wallet balance should be decreased by amount + fee
            $wallet->refresh();
            $this->assertEquals(
                number_format($expectedBalance, 2, '.', ''),
                $wallet->balance,
                'Wallet balance should be decreased by amount + fee'
            );

            // Property: Debit transaction should be created
            $this->assertDatabaseHas('wallet_transactions', [
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'reference_type' => 'withdrawal',
                'reference_id' => $withdrawal->id,
            ]);

            // Property: Audit log should be created
            $this->assertDatabaseHas('wallet_audit_logs', [
                'admin_id' => $admin->id,
                'action' => 'withdrawal_completed',
                'target_type' => 'withdrawal',
                'target_id' => $withdrawal->id,
            ]);
        });
    }

    /**
     * Property 19: Withdrawal request initialization
     * 
     * For any new withdrawal request, it should be created with
     * status='pending' and all required fields.
     * 
     * **Validates: Requirements 4.4, 4.5**
     */
    public function testProperty19WithdrawalRequestInitialization()
    {
        $this->forAll(
            Generator\choose(1000, 5000)  // Withdrawal amount in cents
        )->then(function ($amountInCents) {
            // Create user with sufficient balance
            $user = User::factory()->create();
            $wallet = $user->wallet;
            $wallet->update(['balance' => 10000.00]);

            $amount = $amountInCents / 100;

            $withdrawalService = app(WithdrawalService::class);

            // Create withdrawal request
            $withdrawal = $withdrawalService->createWithdrawalRequest($user, $amount);

            // Property: Status should be pending
            $this->assertEquals('pending', $withdrawal->status,
                'Initial status should be pending');

            // Property: User ID should be set
            $this->assertEquals($user->id, $withdrawal->user_id,
                'User ID should be set correctly');

            // Property: Amount should be set
            $this->assertEquals(
                number_format($amount, 2, '.', ''),
                $withdrawal->amount,
                'Amount should be set correctly'
            );

            // Property: Fee should be calculated
            $expectedFee = $withdrawalService->calculateFee($amount);
            $this->assertEquals(
                number_format($expectedFee, 2, '.', ''),
                $withdrawal->fee,
                'Fee should be calculated correctly'
            );

            // Property: Net amount should be amount minus fee
            $expectedNetAmount = $amount - $expectedFee;
            $this->assertEquals(
                number_format($expectedNetAmount, 2, '.', ''),
                $withdrawal->net_amount,
                'Net amount should be amount minus fee'
            );

            // Property: Timestamps should be set
            $this->assertNotNull($withdrawal->created_at,
                'Created at timestamp should be set');
            $this->assertNotNull($withdrawal->updated_at,
                'Updated at timestamp should be set');

            // Property: Approval fields should be null
            $this->assertNull($withdrawal->approved_by,
                'Approved by should be null initially');
            $this->assertNull($withdrawal->approved_at,
                'Approved at should be null initially');
            $this->assertNull($withdrawal->completed_at,
                'Completed at should be null initially');
        });
    }

    /**
     * Property 31: User withdrawal cancellation
     * 
     * For any pending withdrawal, user can cancel it without
     * creating wallet transaction.
     * 
     * **Validates: Requirements 7.1, 7.3, 7.4**
     */
    public function testProperty31UserWithdrawalCancellation()
    {
        $this->forAll(
            Generator\choose(1000, 5000)  // Withdrawal amount in cents
        )->then(function ($amountInCents) {
            // Create user with sufficient balance
            $user = User::factory()->create();
            $wallet = $user->wallet;
            $initialBalance = 10000.00;
            $wallet->update(['balance' => $initialBalance]);

            $amount = $amountInCents / 100;

            $withdrawalService = app(WithdrawalService::class);

            // Create withdrawal request
            $withdrawal = $withdrawalService->createWithdrawalRequest($user, $amount);

            // Property: Pending withdrawal can be cancelled
            $this->assertEquals('pending', $withdrawal->status,
                'Withdrawal should be pending before cancellation');

            $withdrawal = $withdrawalService->cancelWithdrawal($withdrawal);

            // Property: Status should be cancelled
            $this->assertEquals('cancelled', $withdrawal->status,
                'Status should be cancelled after cancellation');

            // Property: No wallet transaction should be created
            $transactionCount = $wallet->transactions()
                ->where('reference_type', 'withdrawal')
                ->where('reference_id', $withdrawal->id)
                ->count();
            
            $this->assertEquals(0, $transactionCount,
                'No wallet transaction should be created for cancellation');

            // Property: Wallet balance should remain unchanged
            $wallet->refresh();
            $this->assertEquals(
                number_format($initialBalance, 2, '.', ''),
                $wallet->balance,
                'Wallet balance should remain unchanged after cancellation'
            );
        });
    }

    /**
     * Property 32: Cancellation status restriction
     * 
     * For any approved/processing/completed withdrawal,
     * cancellation should fail.
     * 
     * **Validates: Requirements 7.2**
     */
    public function testProperty32CancellationStatusRestriction()
    {
        $this->forAll(
            Generator\choose(1000, 5000),  // Withdrawal amount in cents
            Generator\elements(['approved', 'processing', 'completed'])  // Non-cancellable statuses
        )->then(function ($amountInCents, $targetStatus) {
            // Create user and admin with sufficient balance
            $user = User::factory()->create();
            $admin = User::factory()->create(['role' => 'admin']);
            $wallet = $user->wallet;
            $wallet->update(['balance' => 10000.00]);

            $amount = $amountInCents / 100;

            $withdrawalService = app(WithdrawalService::class);

            // Create withdrawal request
            $withdrawal = $withdrawalService->createWithdrawalRequest($user, $amount);

            // Move withdrawal to target status
            if ($targetStatus === 'approved' || $targetStatus === 'processing' || $targetStatus === 'completed') {
                $withdrawal = $withdrawalService->approveWithdrawal($withdrawal, $admin);
            }
            if ($targetStatus === 'processing' || $targetStatus === 'completed') {
                $withdrawal = $withdrawalService->markProcessing($withdrawal, $admin);
            }
            if ($targetStatus === 'completed') {
                $withdrawal = $withdrawalService->completeWithdrawal($withdrawal, $admin);
            }

            // Property: Cancellation should fail for non-pending status
            $this->expectException(InvalidWithdrawalStatusException::class);
            $withdrawalService->cancelWithdrawal($withdrawal);
        });
    }

    /**
     * Property 20: Withdrawal fee calculation
     * 
     * For any withdrawal request, fee should be calculated correctly
     * and net_amount should equal amount minus fee.
     * 
     * **Validates: Requirements 4.6, 12.1, 12.2, 12.3, 12.4, 12.5**
     */
    public function testProperty20WithdrawalFeeCalculation()
    {
        $this->forAll(
            Generator\choose(1000, 10000)  // Withdrawal amount in cents
        )->then(function ($amountInCents) {
            $amount = $amountInCents / 100;

            $withdrawalService = app(WithdrawalService::class);

            // Calculate fee
            $fee = $withdrawalService->calculateFee($amount);

            // Property: Fee should be non-negative
            $this->assertGreaterThanOrEqual(0, $fee,
                'Fee should be non-negative');

            // Property: Fee should be calculated based on config
            $feeConfig = config('wallet.withdrawal_fee', ['type' => 'none', 'value' => 0]);
            
            $expectedFee = match ($feeConfig['type']) {
                'percentage' => round($amount * ($feeConfig['value'] / 100), 2),
                'fixed' => (float) $feeConfig['value'],
                default => 0.00,
            };

            $this->assertEquals($expectedFee, $fee,
                'Fee should match configured calculation');

            // Property: Net amount should equal amount minus fee
            $expectedNetAmount = $amount - $fee;
            
            // Create withdrawal to verify net_amount calculation
            $user = User::factory()->create();
            $wallet = $user->wallet;
            $wallet->update(['balance' => 10000.00]);

            $withdrawal = $withdrawalService->createWithdrawalRequest($user, $amount);

            $this->assertEquals(
                number_format($expectedNetAmount, 2, '.', ''),
                $withdrawal->net_amount,
                'Net amount should equal amount minus fee'
            );
        });
    }
}
