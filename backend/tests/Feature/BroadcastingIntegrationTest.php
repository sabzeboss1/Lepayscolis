<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Events\PaymentStatusChanged;
use App\Events\ShipmentStatusChanged;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class BroadcastingIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_message_sent_event_is_dispatched_on_message_creation(): void
    {
        Event::fake([MessageSent::class]);

        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user1->id,
            'recipient_id' => $user2->id,
            'content' => 'Test message',
            'read' => false,
        ]);

        Event::assertDispatched(MessageSent::class, function ($event) use ($message) {
            return $event->message->id === $message->id;
        });
    }

    public function test_shipment_status_changed_event_is_dispatched_on_status_update(): void
    {
        Event::fake([ShipmentStatusChanged::class]);

        $shipment = Shipment::factory()->create([
            'status' => 'pending',
        ]);

        $shipment->update(['status' => 'accepted']);

        Event::assertDispatched(ShipmentStatusChanged::class, function ($event) use ($shipment) {
            return $event->shipment->id === $shipment->id
                && $event->oldStatus === 'pending'
                && $event->newStatus === 'accepted';
        });
    }

    public function test_shipment_status_changed_event_not_dispatched_when_status_unchanged(): void
    {
        Event::fake([ShipmentStatusChanged::class]);

        $shipment = Shipment::factory()->create([
            'status' => 'pending',
            'package_description' => 'Old description',
        ]);

        $shipment->update(['package_description' => 'New description']);

        Event::assertNotDispatched(ShipmentStatusChanged::class);
    }

    public function test_payment_status_changed_event_is_dispatched_on_status_update(): void
    {
        Event::fake([PaymentStatusChanged::class]);

        $payment = Payment::factory()->create([
            'status' => 'pending',
        ]);

        $payment->update(['status' => 'escrowed']);

        Event::assertDispatched(PaymentStatusChanged::class, function ($event) use ($payment) {
            return $event->payment->id === $payment->id
                && $event->oldStatus === 'pending'
                && $event->newStatus === 'escrowed';
        });
    }

    public function test_payment_status_changed_event_not_dispatched_when_status_unchanged(): void
    {
        Event::fake([PaymentStatusChanged::class]);

        $payment = Payment::factory()->create([
            'status' => 'pending',
            'amount' => 100.00,
        ]);

        $payment->update(['amount' => 150.00]);

        Event::assertNotDispatched(PaymentStatusChanged::class);
    }

    public function test_multiple_status_changes_dispatch_multiple_events(): void
    {
        Event::fake([ShipmentStatusChanged::class]);

        $shipment = Shipment::factory()->create([
            'status' => 'pending',
        ]);

        $shipment->update(['status' => 'accepted']);
        $shipment->update(['status' => 'in_transit']);

        Event::assertDispatched(ShipmentStatusChanged::class, 2);
    }
}
