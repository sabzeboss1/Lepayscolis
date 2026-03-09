<?php

namespace Tests\Unit\Events;

use App\Events\PaymentStatusChanged;
use App\Models\Payment;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentStatusChangedEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_broadcasts_to_payer_and_payee_channels(): void
    {
        $payer = User::factory()->create();
        $payee = User::factory()->create();
        $shipment = Shipment::factory()->create();
        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $payer->id,
            'payee_id' => $payee->id,
        ]);

        $event = new PaymentStatusChanged($payment, 'pending', 'escrowed');
        $channels = $event->broadcastOn();

        $this->assertCount(2, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertInstanceOf(PrivateChannel::class, $channels[1]);
        
        $channelNames = array_map(fn($channel) => $channel->name, $channels);
        $this->assertContains('private-user.' . $payer->id, $channelNames);
        $this->assertContains('private-user.' . $payee->id, $channelNames);
    }

    public function test_event_broadcasts_with_correct_name(): void
    {
        $payment = Payment::factory()->create();
        $event = new PaymentStatusChanged($payment, 'pending', 'escrowed');

        $this->assertEquals('payment.status.changed', $event->broadcastAs());
    }

    public function test_event_broadcasts_with_correct_data(): void
    {
        $shipment = Shipment::factory()->create();
        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'amount' => 100.00,
            'status' => 'escrowed',
        ]);

        $event = new PaymentStatusChanged($payment, 'pending', 'escrowed');
        $data = $event->broadcastWith();

        $this->assertArrayHasKey('payment_id', $data);
        $this->assertArrayHasKey('shipment_id', $data);
        $this->assertArrayHasKey('old_status', $data);
        $this->assertArrayHasKey('new_status', $data);
        $this->assertArrayHasKey('amount', $data);
        $this->assertArrayHasKey('updated_at', $data);

        $this->assertEquals($payment->id, $data['payment_id']);
        $this->assertEquals($shipment->id, $data['shipment_id']);
        $this->assertEquals('pending', $data['old_status']);
        $this->assertEquals('escrowed', $data['new_status']);
        $this->assertEquals(100.00, $data['amount']);
    }
}
