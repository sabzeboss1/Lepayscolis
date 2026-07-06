<?php

namespace App\Services;

use App\Events\WithdrawalApproved;
use App\Events\WithdrawalCompleted;
use App\Events\WithdrawalRejected;
use App\Events\WithdrawalRequested;
use App\Exceptions\DuplicatePendingWithdrawalException;
use App\Exceptions\InsufficientBalanceException;
use App\Exceptions\InvalidWithdrawalStatusException;
use App\Exceptions\MinimumWithdrawalException;
use App\Models\User;
use App\Models\WalletAuditLog;
use App\Models\WithdrawalRequest;
use Illuminate\Support\Facades\DB;

class WithdrawalService
{
    /**
     * Valid status transitions for withdrawal requests.
     */
    private const STATUS_TRANSITIONS = [
        'pending' => ['approved', 'rejected', 'cancelled'],
        'approved' => ['processing', 'rejected'],
        'processing' => ['completed'],
        'completed' => [],
        'rejected' => [],
        'cancelled' => [],
    ];

    /**
     * Create a new WithdrawalService instance.
     *
     * @param WalletService $walletService
     */
    public function __construct(private WalletService $walletService)
    {
    }

    /**
     * Validate withdrawal request.
     *
     * @param User $user
     * @param float $amount
     * @return void
     * @throws MinimumWithdrawalException
     * @throws InsufficientBalanceException
     */
    public function validateWithdrawalRequest(User $user, float $amount): void
    {
        $minimumAmount = config('wallet.minimum_withdrawal', 10.00);
        
        // Check minimum amount
        if ($amount < $minimumAmount) {
            throw new MinimumWithdrawalException($amount, $minimumAmount);
        }
        
        // Check maximum amount if configured
        $maximumAmount = config('wallet.maximum_withdrawal');
        if ($maximumAmount !== null && $amount > $maximumAmount) {
            throw new \InvalidArgumentException(
                sprintf('Withdrawal amount %.2f %s exceeds the maximum allowed amount of %.2f %s',
                    $amount, $this->walletService->getWallet($user)->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
                    $maximumAmount, $this->walletService->getWallet($user)->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency()
                )
            );
        }
        
        // Check balance
        $wallet = $this->walletService->getWallet($user);
        $fee = $this->calculateFee($amount);
        $totalRequired = $amount + $fee;
        
        if (!$this->walletService->validateSufficientBalance($wallet, $totalRequired)) {
            throw new InsufficientBalanceException($totalRequired, $wallet->balance);
        }
    }

    /**
     * Calculate withdrawal fee based on configuration.
     *
     * @param float $amount
     * @return float
     */
    public function calculateFee(float $amount): float
    {
        $feeConfig = config('wallet.withdrawal_fee', ['type' => 'none', 'value' => 0]);
        
        return match ($feeConfig['type']) {
            'percentage' => round($amount * ($feeConfig['value'] / 100), 2),
            'fixed' => (float) $feeConfig['value'],
            default => 0.00,
        };
    }

    /**
     * Create a new withdrawal request.
     *
     * @param User $user
     * @param float $amount
     * @param string $countryCode
     * @param string $currency
     * @param string $paymentMethod
     * @param array $paymentDetails
     * @return WithdrawalRequest
     * @throws DuplicatePendingWithdrawalException
     * @throws MinimumWithdrawalException
     * @throws InsufficientBalanceException
     */
    public function createWithdrawalRequest(
        User $user, 
        float $amount,
        string $countryCode,
        string $currency,
        string $paymentMethod,
        array $paymentDetails
    ): WithdrawalRequest
    {
        // Check for existing pending withdrawal
        $existingPending = WithdrawalRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();
        
        if ($existingPending) {
            throw new DuplicatePendingWithdrawalException($existingPending->id);
        }
        
        // Validate withdrawal request
        $this->validateWithdrawalRequest($user, $amount);
        
        // Calculate fee and net amount
        $fee = $this->calculateFee($amount);
        $netAmount = $amount - $fee;
        
        // Create withdrawal request
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => $amount,
            'fee' => $fee,
            'net_amount' => $netAmount,
            'country_code' => $countryCode,
            'currency' => $currency,
            'payment_method' => $paymentMethod,
            'payment_details' => $paymentDetails,
            'status' => 'pending',
        ]);
        
        // Dispatch event for admin notification
        event(new WithdrawalRequested($withdrawal));
        
        return $withdrawal;
    }

    /**
     * Check if withdrawal can transition to a new status.
     *
     * @param WithdrawalRequest $withdrawal
     * @param string $newStatus
     * @return bool
     */
    public function canTransitionTo(WithdrawalRequest $withdrawal, string $newStatus): bool
    {
        $currentStatus = $withdrawal->status;
        
        if (!isset(self::STATUS_TRANSITIONS[$currentStatus])) {
            return false;
        }
        
        return in_array($newStatus, self::STATUS_TRANSITIONS[$currentStatus]);
    }

    /**
     * Approve a withdrawal request.
     *
     * @param WithdrawalRequest $withdrawal
     * @param User $admin
     * @return WithdrawalRequest
     * @throws InvalidWithdrawalStatusException
     * @throws InsufficientBalanceException
     */
    public function approveWithdrawal(WithdrawalRequest $withdrawal, User $admin): WithdrawalRequest
    {
        return DB::transaction(function () use ($withdrawal, $admin) {
            // Validate status transition
            if (!$this->canTransitionTo($withdrawal, 'approved')) {
                throw new InvalidWithdrawalStatusException($withdrawal->status, 'approved');
            }
            
            // Re-validate balance at approval time
            $wallet = $this->walletService->getWallet($withdrawal->user);
            $totalRequired = $withdrawal->amount + $withdrawal->fee;
            
            if (!$this->walletService->validateSufficientBalance($wallet, $totalRequired)) {
                throw new InsufficientBalanceException($totalRequired, $wallet->balance);
            }
            
            // Update withdrawal status
            $withdrawal->update([
                'status' => 'approved',
                'approved_by' => $admin->id,
                'approved_at' => now(),
            ]);
            
            // Create audit log entry
            WalletAuditLog::create([
                'admin_id' => $admin->id,
                'action' => 'withdrawal_approved',
                'target_type' => 'withdrawal',
                'target_id' => $withdrawal->id,
                'reason' => 'Withdrawal request approved',
                'metadata' => json_encode([
                    'amount' => $withdrawal->amount,
                    'fee' => $withdrawal->fee,
                    'user_id' => $withdrawal->user_id,
                ]),
            ]);
            
            // Dispatch event for user notification
            event(new WithdrawalApproved($withdrawal));
            
            return $withdrawal;
        });
    }

    /**
     * Reject a withdrawal request.
     *
     * @param WithdrawalRequest $withdrawal
     * @param string $reason
     * @param User $admin
     * @return WithdrawalRequest
     * @throws InvalidWithdrawalStatusException
     */
    public function rejectWithdrawal(WithdrawalRequest $withdrawal, string $reason, User $admin): WithdrawalRequest
    {
        return DB::transaction(function () use ($withdrawal, $reason, $admin) {
            // Validate status transition
            if (!$this->canTransitionTo($withdrawal, 'rejected')) {
                throw new InvalidWithdrawalStatusException($withdrawal->status, 'rejected');
            }
            
            // Update withdrawal status
            $withdrawal->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
            ]);
            
            // Create audit log entry
            WalletAuditLog::create([
                'admin_id' => $admin->id,
                'action' => 'withdrawal_rejected',
                'target_type' => 'withdrawal',
                'target_id' => $withdrawal->id,
                'reason' => $reason,
                'metadata' => json_encode([
                    'amount' => $withdrawal->amount,
                    'fee' => $withdrawal->fee,
                    'user_id' => $withdrawal->user_id,
                ]),
            ]);
            
            // Dispatch event for user notification
            event(new WithdrawalRejected($withdrawal, $reason));
            
            return $withdrawal;
        });
    }

    /**
     * Mark withdrawal as processing.
     *
     * @param WithdrawalRequest $withdrawal
     * @param User $admin
     * @return WithdrawalRequest
     * @throws InvalidWithdrawalStatusException
     */
    public function markProcessing(WithdrawalRequest $withdrawal, User $admin): WithdrawalRequest
    {
        return DB::transaction(function () use ($withdrawal, $admin) {
            // Validate status transition
            if (!$this->canTransitionTo($withdrawal, 'processing')) {
                throw new InvalidWithdrawalStatusException($withdrawal->status, 'processing');
            }
            
            // Update withdrawal status
            $withdrawal->update([
                'status' => 'processing',
            ]);
            
            // Create audit log entry
            WalletAuditLog::create([
                'admin_id' => $admin->id,
                'action' => 'withdrawal_processing',
                'target_type' => 'withdrawal',
                'target_id' => $withdrawal->id,
                'reason' => 'Withdrawal marked as processing',
                'metadata' => json_encode([
                    'amount' => $withdrawal->amount,
                    'fee' => $withdrawal->fee,
                    'user_id' => $withdrawal->user_id,
                ]),
            ]);
            
            return $withdrawal;
        });
    }

    /**
     * Complete a withdrawal request and debit wallet.
     *
     * @param WithdrawalRequest $withdrawal
     * @param User $admin
     * @return WithdrawalRequest
     * @throws InvalidWithdrawalStatusException
     * @throws InsufficientBalanceException
     */
    public function completeWithdrawal(WithdrawalRequest $withdrawal, User $admin): WithdrawalRequest
    {
        return DB::transaction(function () use ($withdrawal, $admin) {
            // Validate status transition
            if (!$this->canTransitionTo($withdrawal, 'completed')) {
                throw new InvalidWithdrawalStatusException($withdrawal->status, 'completed');
            }
            
            // Debit wallet (includes validation and transaction safety)
            $this->walletService->debit(
                $withdrawal->user->wallet,
                $withdrawal->amount + $withdrawal->fee,
                "Withdrawal completed: {$withdrawal->id}",
                'withdrawal',
                $withdrawal->id
            );
            
            // Update withdrawal status
            $withdrawal->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
            
            // Create audit log entry
            WalletAuditLog::create([
                'admin_id' => $admin->id,
                'action' => 'withdrawal_completed',
                'target_type' => 'withdrawal',
                'target_id' => $withdrawal->id,
                'reason' => 'Withdrawal completed and funds disbursed',
                'metadata' => json_encode([
                    'amount' => $withdrawal->amount,
                    'fee' => $withdrawal->fee,
                    'user_id' => $withdrawal->user_id,
                ]),
            ]);
            
            // Dispatch event for user notification
            event(new WithdrawalCompleted($withdrawal));
            
            return $withdrawal;
        });
    }

    /**
     * Cancel a pending withdrawal request.
     *
     * @param WithdrawalRequest $withdrawal
     * @return WithdrawalRequest
     * @throws InvalidWithdrawalStatusException
     */
    public function cancelWithdrawal(WithdrawalRequest $withdrawal): WithdrawalRequest
    {
        // Validate status is pending
        if ($withdrawal->status !== 'pending') {
            throw new InvalidWithdrawalStatusException($withdrawal->status, 'cancelled');
        }
        
        // Update withdrawal status
        $withdrawal->update([
            'status' => 'cancelled',
        ]);
        
        // No wallet transaction created for cancellation
        // No audit log needed for user-initiated cancellation
        
        return $withdrawal;
    }
}
