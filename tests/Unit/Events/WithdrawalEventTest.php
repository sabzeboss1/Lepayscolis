<?php

namespace Tests\Unit\Events;

use App\Events\WithdrawalApproved;
use App\Events\WithdrawalCompleted;
use App\Events\WithdrawalRejected;
use App\Events\WithdrawalRequested;
use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WithdrawalEventTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test WithdrawalRequested event has required properties.
     */
    public function test_withdrawal_requested_event_has_required_properties(): void
    {
        // Arrange
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        // Act
        $event = new WithdrawalRequested($withdrawal);

        // Assert
        $this->assertInstanceOf(WithdrawalRequest::class, $event->withdrawal);
        $this->assertEquals($withdrawal->id, $event->withdrawal->id);
        $this->assertEquals($user->id, $event->withdrawal->user_id);
        $this->assertEquals('pending', $event->withdrawal->status);
    }

    /**
     * Test WithdrawalApproved event has required properties.
     */
    public function test_withdrawal_approved_event_has_required_properties(): void
    {
        // Arrange
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'approved',
            'approved_by' => $admin->id,
            'approved_at' => now(),
        ]);

        // Act
        $event = new WithdrawalApproved($withdrawal);

        // Assert
        $this->assertInstanceOf(WithdrawalRequest::class, $event->withdrawal);
        $this->assertEquals($withdrawal->id, $event->withdrawal->id);
        $this->assertEquals($user->id, $event->withdrawal->user_id);
        $this->assertEquals('approved', $event->withdrawal->status);
        $this->assertEquals($admin->id, $event->withdrawal->approved_by);
        $this->assertNotNull($event->withdrawal->approved_at);
    }

    /**
     * Test WithdrawalRejected event has required properties.
     */
    public function test_withdrawal_rejected_event_has_required_properties(): void
    {
        // Arrange
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $reason = 'Insufficient documentation provided';
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'approved_by' => $admin->id,
        ]);

        // Act
        $event = new WithdrawalRejected($withdrawal, $reason);

        // Assert
        $this->assertInstanceOf(WithdrawalRequest::class, $event->withdrawal);
        $this->assertIsString($event->reason);
        $this->assertEquals($withdrawal->id, $event->withdrawal->id);
        $this->assertEquals($user->id, $event->withdrawal->user_id);
        $this->assertEquals('rejected', $event->withdrawal->status);
        $this->assertEquals($reason, $event->reason);
        $this->assertEquals($reason, $event->withdrawal->rejection_reason);
    }

    /**
     * Test WithdrawalCompleted event has required properties.
     */
    public function test_withdrawal_completed_event_has_required_properties(): void
    {
        // Arrange
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'completed',
            'approved_by' => $admin->id,
            'approved_at' => now()->subHours(2),
            'completed_at' => now(),
        ]);

        // Act
        $event = new WithdrawalCompleted($withdrawal);

        // Assert
        $this->assertInstanceOf(WithdrawalRequest::class, $event->withdrawal);
        $this->assertEquals($withdrawal->id, $event->withdrawal->id);
        $this->assertEquals($user->id, $event->withdrawal->user_id);
        $this->assertEquals('completed', $event->withdrawal->status);
        $this->assertNotNull($event->withdrawal->completed_at);
        $this->assertNotNull($event->withdrawal->approved_at);
    }

    /**
     * Test WithdrawalRequested event can be dispatched.
     */
    public function test_withdrawal_requested_event_can_be_dispatched(): void
    {
        // Arrange
        \Event::fake([WithdrawalRequested::class]);
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        // Act
        event(new WithdrawalRequested($withdrawal));

        // Assert
        \Event::assertDispatched(WithdrawalRequested::class, function ($event) use ($withdrawal) {
            return $event->withdrawal->id === $withdrawal->id;
        });
    }

    /**
     * Test WithdrawalApproved event can be dispatched.
     */
    public function test_withdrawal_approved_event_can_be_dispatched(): void
    {
        // Arrange
        \Event::fake([WithdrawalApproved::class]);
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'approved',
        ]);

        // Act
        event(new WithdrawalApproved($withdrawal));

        // Assert
        \Event::assertDispatched(WithdrawalApproved::class, function ($event) use ($withdrawal) {
            return $event->withdrawal->id === $withdrawal->id;
        });
    }

    /**
     * Test WithdrawalRejected event can be dispatched.
     */
    public function test_withdrawal_rejected_event_can_be_dispatched(): void
    {
        // Arrange
        \Event::fake([WithdrawalRejected::class]);
        $user = User::factory()->create();
        $reason = 'Invalid bank account details';
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        // Act
        event(new WithdrawalRejected($withdrawal, $reason));

        // Assert
        \Event::assertDispatched(WithdrawalRejected::class, function ($event) use ($withdrawal, $reason) {
            return $event->withdrawal->id === $withdrawal->id
                && $event->reason === $reason;
        });
    }

    /**
     * Test WithdrawalCompleted event can be dispatched.
     */
    public function test_withdrawal_completed_event_can_be_dispatched(): void
    {
        // Arrange
        \Event::fake([WithdrawalCompleted::class]);
        $user = User::factory()->create();
        $withdrawal = WithdrawalRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        // Act
        event(new WithdrawalCompleted($withdrawal));

        // Assert
        \Event::assertDispatched(WithdrawalCompleted::class, function ($event) use ($withdrawal) {
            return $event->withdrawal->id === $withdrawal->id;
        });
    }
}
