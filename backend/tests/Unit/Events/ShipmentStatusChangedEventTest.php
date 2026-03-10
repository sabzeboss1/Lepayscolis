<?php

namespace Tests\Unit\Events;

use App\Events\ShipmentStatusChanged;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShipmentStatusChangedEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_broadcasts_to_sender_channel(): void
    {
        $sender = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => null,
        ]);

        $event = new ShipmentStatusChanged($shipment, 'pending', 'accepted');
        $channels = $event->broadcastOn();

        $this->assertCount(1, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertEquals('private-user.' . $sender->id, $channels[0]->name);
    }

    public function test_event_broadcasts_to_sender_and_traveler_channels(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
        ]);

        $event = new ShipmentStatusChanged($shipment, 'accepted', 'in_transit');
        $channels = $event->broadcastOn();

        $this->assertCount(2, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertInstanceOf(PrivateChannel::class, $channels[1]);
        
        $channelNames = array_map(fn($channel) => $channel->name, $channels);
        $this->assertContains('private-user.' . $sender->id, $channelNames);
        $this->assertContains('private-user.' . $traveler->id, $channelNames);
    }

    public function test_event_broadcasts_with_correct_name(): void
    {
        $shipment = Shipment::factory()->create();
        $event = new ShipmentStatusChanged($shipment, 'pending', 'accepted');

        $this->assertEquals('shipment.status.changed', $event->broadcastAs());
    }

    public function test_event_broadcasts_with_correct_data(): void
    {
        $shipment = Shipment::factory()->create([
            'status' => 'accepted',
            'payment_status' => 'pending',
        ]);

        $event = new ShipmentStatusChanged($shipment, 'pending', 'accepted');
        $data = $event->broadcastWith();

        $this->assertArrayHasKey('shipment_id', $data);
        $this->assertArrayHasKey('old_status', $data);
        $this->assertArrayHasKey('new_status', $data);
        $this->assertArrayHasKey('payment_status', $data);
        $this->assertArrayHasKey('updated_at', $data);

        $this->assertEquals($shipment->id, $data['shipment_id']);
        $this->assertEquals('pending', $data['old_status']);
        $this->assertEquals('accepted', $data['new_status']);
        $this->assertEquals('pending', $data['payment_status']);
    }
}
