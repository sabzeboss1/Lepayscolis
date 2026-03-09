<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_payments_table_has_correct_columns(): void
    {
        $this->assertTrue(
            \Schema::hasTable('payments'),
            'Payments table does not exist'
        );

        $columns = [
            'id',
            'shipment_id',
            'payer_id',
            'payee_id',
            'amount',
            'platform_fee',
            'traveler_amount',
            'payment_method',
            'transaction_id',
            'status',
            'escrowed_at',
            'released_at',
            'created_at',
            'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                \Schema::hasColumn('payments', $column),
                "Payments table is missing column: {$column}"
            );
        }
    }

    public function test_can_create_payment_with_all_fields(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->accepted()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
        ]);

        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => 100.00,
            'platform_fee' => 15.00,
            'traveler_amount' => 85.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test123',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'shipment_id' => $shipment->id,
            'amount' => 100.00,
        ]);
    }

    public function test_payment_has_shipment_relationship(): void
    {
        $payment = Payment::factory()->create();

        $this->assertInstanceOf(Shipment::class, $payment->shipment);
    }

    public function test_payment_has_payer_relationship(): void
    {
        $payment = Payment::factory()->create();

        $this->assertInstanceOf(User::class, $payment->payer);
    }

    public function test_payment_has_payee_relationship(): void
    {
        $payment = Payment::factory()->create();

        $this->assertInstanceOf(User::class, $payment->payee);
    }

    public function test_payment_status_enum_values(): void
    {
        $statuses = ['pending', 'processing', 'escrowed', 'released', 'refunded', 'failed'];

        foreach ($statuses as $status) {
            $payment = Payment::factory()->create(['status' => $status]);
            $this->assertEquals($status, $payment->status);
        }
    }

    public function test_payment_transaction_id_is_unique(): void
    {
        $transactionId = 'pi_unique_test';
        
        Payment::factory()->create(['transaction_id' => $transactionId]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Payment::factory()->create(['transaction_id' => $transactionId]);
    }

    public function test_payment_automatically_calculates_fees(): void
    {
        $amount = 100.00;
        
        $payment = Payment::create([
            'shipment_id' => Shipment::factory()->accepted()->create()->id,
            'payer_id' => User::factory()->create()->id,
            'payee_id' => User::factory()->create()->id,
            'amount' => $amount,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_' . uniqid(),
            'status' => 'pending',
        ]);

        $this->assertEquals(15.00, $payment->platform_fee);
        $this->assertEquals(85.00, $payment->traveler_amount);
    }

    public function test_payment_escrowed_state(): void
    {
        $payment = Payment::factory()->escrowed()->create();

        $this->assertEquals('escrowed', $payment->status);
        $this->assertNotNull($payment->escrowed_at);
    }

    public function test_payment_released_state(): void
    {
        $payment = Payment::factory()->released()->create();

        $this->assertEquals('released', $payment->status);
        $this->assertNotNull($payment->escrowed_at);
        $this->assertNotNull($payment->released_at);
    }

    public function test_payment_refunded_state(): void
    {
        $payment = Payment::factory()->refunded()->create();

        $this->assertEquals('refunded', $payment->status);
    }

    public function test_payment_failed_state(): void
    {
        $payment = Payment::factory()->failed()->create();

        $this->assertEquals('failed', $payment->status);
    }

    public function test_payment_method_values(): void
    {
        $methods = ['card', 'mobile_money'];

        foreach ($methods as $method) {
            $payment = Payment::factory()->create(['payment_method' => $method]);
            $this->assertEquals($method, $payment->payment_method);
        }
    }
}
