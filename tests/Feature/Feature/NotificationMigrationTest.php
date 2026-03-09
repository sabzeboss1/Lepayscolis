<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifications_table_has_correct_columns(): void
    {
        $this->assertTrue(
            \Schema::hasTable('notifications'),
            'Notifications table does not exist'
        );

        $columns = [
            'id',
            'user_id',
            'type',
            'title',
            'body',
            'data',
            'read_at',
            'created_at',
            'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                \Schema::hasColumn('notifications', $column),
                "Notifications table is missing column: {$column}"
            );
        }
    }

    public function test_can_create_notification_with_all_fields(): void
    {
        $user = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => 'shipment_created',
            'title' => 'New Shipment',
            'body' => 'A new shipment has been created.',
            'data' => ['shipment_id' => '123'],
        ]);

        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'user_id' => $user->id,
            'type' => 'shipment_created',
        ]);
    }

    public function test_notification_has_user_relationship(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $notification->user);
        $this->assertEquals($user->id, $notification->user->id);
    }

    public function test_notification_data_is_cast_to_array(): void
    {
        $data = ['shipment_id' => '123', 'action_url' => '/shipments/123'];
        $notification = Notification::factory()->create(['data' => $data]);

        $this->assertIsArray($notification->data);
        $this->assertEquals($data, $notification->data);
    }

    public function test_notification_defaults_to_unread(): void
    {
        $notification = Notification::factory()->create();

        $this->assertNull($notification->read_at);
        $this->assertFalse($notification->isRead());
    }

    public function test_notification_can_be_marked_as_read(): void
    {
        $notification = Notification::factory()->create();

        $notification->markAsRead();

        $this->assertNotNull($notification->read_at);
        $this->assertTrue($notification->isRead());
    }

    public function test_notification_read_state(): void
    {
        $notification = Notification::factory()->read()->create();

        $this->assertNotNull($notification->read_at);
        $this->assertTrue($notification->isRead());
    }

    public function test_notification_unread_scope(): void
    {
        $user = User::factory()->create();
        
        Notification::factory()->count(3)->create(['user_id' => $user->id]);
        Notification::factory()->count(2)->read()->create(['user_id' => $user->id]);

        $unreadCount = Notification::where('user_id', $user->id)->unread()->count();
        $this->assertEquals(3, $unreadCount);
    }

    public function test_notification_read_scope(): void
    {
        $user = User::factory()->create();
        
        Notification::factory()->count(3)->create(['user_id' => $user->id]);
        Notification::factory()->count(2)->read()->create(['user_id' => $user->id]);

        $readCount = Notification::where('user_id', $user->id)->read()->count();
        $this->assertEquals(2, $readCount);
    }

    public function test_notification_types(): void
    {
        $types = [
            'shipment_created',
            'shipment_accepted',
            'kyc_approved',
            'kyc_rejected',
            'payment_released',
        ];

        foreach ($types as $type) {
            $notification = Notification::factory()->create(['type' => $type]);
            $this->assertEquals($type, $notification->type);
        }
    }

    public function test_notification_factory_shipment_state(): void
    {
        $notification = Notification::factory()->shipment()->create();

        $this->assertEquals('shipment_created', $notification->type);
        $this->assertEquals('New Shipment Request', $notification->title);
    }

    public function test_notification_factory_kyc_approved_state(): void
    {
        $notification = Notification::factory()->kycApproved()->create();

        $this->assertEquals('kyc_approved', $notification->type);
        $this->assertEquals('KYC Approved', $notification->title);
    }

    public function test_notification_factory_kyc_rejected_state(): void
    {
        $notification = Notification::factory()->kycRejected()->create();

        $this->assertEquals('kyc_rejected', $notification->type);
        $this->assertEquals('KYC Rejected', $notification->title);
    }
}
