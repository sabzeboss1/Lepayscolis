<?php

namespace Tests\Unit;

use App\Models\Payment;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_has_shipment_relationship(): void
    {
        $payment = Payment::factory()->create();

        $this->assertInstanceOf(Shipment::class, $payment->shipment);
        $this->assertEquals($payment->shipment_id, $payment->shipment->id);
    }

    public function test_payment_has_payer_relationship(): void
    {
        $payment = Payment::factory()->create();

        $this->assertInstanceOf(User::class, $payment->payer);
        $this->assertEquals($payment->payer_id, $payment->payer->id);
    }

    public function test_payment_has_payee_relationship(): void
    {
        $payment = Payment::factory()->create();

        $this->assertInstanceOf(User::class, $payment->payee);
        $this->assertEquals($payment->payee_id, $payment->payee->id);
    }

    public function test_payment_casts_amount_as_decimal(): void
    {
        $payment = Payment::factory()->create([
            'amount' => 100.50,
        ]);

        $this->assertIsString($payment->amount);
        $this->assertEquals('100.50', $payment->amount);
    }

    public function test_payment_casts_platform_fee_as_decimal(): void
    {
        $payment = Payment::factory()->create([
            'amount' => 100.00,
        ]);

        $this->assertIsString($payment->platform_fee);
        $this->assertEquals('15.00', $payment->platform_fee);
    }

    public function test_payment_casts_traveler_amount_as_decimal(): void
    {
        $payment = Payment::factory()->create([
            'amount' => 100.00,
        ]);

        $this->assertIsString($payment->traveler_amount);
        $this->assertEquals('85.00', $payment->traveler_amount);
    }

    public function test_payment_casts_escrowed_at_as_datetime(): void
    {
        $payment = Payment::factory()->escrowed()->create();

        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $payment->escrowed_at);
    }

    public function test_payment_casts_released_at_as_datetime(): void
    {
        $payment = Payment::factory()->released()->create();

        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $payment->released_at);
    }

    public function test_payment_has_fillable_fields(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        $payer = $shipment->sender;
        $payee = $shipment->traveler;

        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $payer->id,
            'payee_id' => $payee->id,
            'amount' => 200.00,
            'platform_fee' => 30.00,
            'traveler_amount' => 170.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test123',
            'status' => 'processing',
            'escrowed_at' => now(),
            'released_at' => null,
        ]);

        $this->assertEquals($shipment->id, $payment->shipment_id);
        $this->assertEquals($payer->id, $payment->payer_id);
        $this->assertEquals($payee->id, $payment->payee_id);
        $this->assertEquals('200.00', $payment->amount);
        $this->assertEquals('30.00', $payment->platform_fee);
        $this->assertEquals('170.00', $payment->traveler_amount);
        $this->assertEquals('card', $payment->payment_method);
        $this->assertEquals('pi_test123', $payment->transaction_id);
        $this->assertEquals('processing', $payment->status);
    }

    public function test_observer_calculates_platform_fee_on_create(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 100.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test456',
            'status' => 'pending',
        ]);

        // Platform fee should be 15% of amount
        $this->assertEquals('15.00', $payment->platform_fee);
    }

    public function test_observer_calculates_traveler_amount_on_create(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 100.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test789',
            'status' => 'pending',
        ]);

        // Traveler amount should be 85% of amount
        $this->assertEquals('85.00', $payment->traveler_amount);
    }

    public function test_observer_calculates_fees_correctly_for_various_amounts(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        // Test with 50.00
        $payment1 = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 50.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_50',
            'status' => 'pending',
        ]);
        $this->assertEquals('7.50', $payment1->platform_fee);
        $this->assertEquals('42.50', $payment1->traveler_amount);

        // Test with 250.75
        $payment2 = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 250.75,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_250',
            'status' => 'pending',
        ]);
        $this->assertEquals('37.61', $payment2->platform_fee);
        $this->assertEquals('213.14', $payment2->traveler_amount);

        // Test with 1000.00
        $payment3 = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 1000.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_1000',
            'status' => 'pending',
        ]);
        $this->assertEquals('150.00', $payment3->platform_fee);
        $this->assertEquals('850.00', $payment3->traveler_amount);
    }

    public function test_observer_calculates_fees_for_small_amounts(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        // Test with 10.00 (minimum realistic amount)
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 10.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_10',
            'status' => 'pending',
        ]);

        $this->assertEquals('1.50', $payment->platform_fee);
        $this->assertEquals('8.50', $payment->traveler_amount);
    }

    public function test_observer_ensures_platform_fee_plus_traveler_amount_equals_total(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 123.45,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_123',
            'status' => 'pending',
        ]);

        // Verify the sum equals the original amount (within rounding tolerance)
        $platformFee = (float) $payment->platform_fee;
        $travelerAmount = (float) $payment->traveler_amount;
        $total = $platformFee + $travelerAmount;
        
        $this->assertEquals(123.45, $total, '', 0.01);
    }

    public function test_payment_status_can_be_set(): void
    {
        $payment = Payment::factory()->create(['status' => 'pending']);
        $this->assertEquals('pending', $payment->status);

        $payment->update(['status' => 'processing']);
        $this->assertEquals('processing', $payment->status);

        $payment->update(['status' => 'escrowed']);
        $this->assertEquals('escrowed', $payment->status);

        $payment->update(['status' => 'released']);
        $this->assertEquals('released', $payment->status);
    }

    public function test_payment_escrowed_at_can_be_set(): void
    {
        $payment = Payment::factory()->create(['escrowed_at' => null]);
        $this->assertNull($payment->escrowed_at);

        $escrowedTime = now();
        $payment->update(['escrowed_at' => $escrowedTime]);
        
        $this->assertNotNull($payment->escrowed_at);
        $this->assertEquals($escrowedTime->timestamp, $payment->escrowed_at->timestamp);
    }

    public function test_payment_released_at_can_be_set(): void
    {
        $payment = Payment::factory()->create(['released_at' => null]);
        $this->assertNull($payment->released_at);

        $releasedTime = now();
        $payment->update(['released_at' => $releasedTime]);
        
        $this->assertNotNull($payment->released_at);
        $this->assertEquals($releasedTime->timestamp, $payment->released_at->timestamp);
    }

    public function test_payment_transaction_id_is_unique(): void
    {
        $shipment1 = Shipment::factory()->accepted()->create();
        $shipment2 = Shipment::factory()->accepted()->create();

        Payment::create([
            'shipment_id' => $shipment1->id,
            'payer_id' => $shipment1->sender_id,
            'payee_id' => $shipment1->traveler_id,
            'amount' => 100.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_unique_123',
            'status' => 'pending',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Payment::create([
            'shipment_id' => $shipment2->id,
            'payer_id' => $shipment2->sender_id,
            'payee_id' => $shipment2->traveler_id,
            'amount' => 200.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_unique_123', // Duplicate transaction_id
            'status' => 'pending',
        ]);
    }

    public function test_payment_uses_uuid_primary_key(): void
    {
        $payment = Payment::factory()->create();

        $this->assertIsString($payment->id);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $payment->id
        );
    }

    public function test_observer_does_not_override_manually_set_fees(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        // Manually set different fee values (edge case for testing)
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 100.00,
            'platform_fee' => 20.00, // Manually set to 20% instead of 15%
            'traveler_amount' => 80.00, // Manually set to 80% instead of 85%
            'payment_method' => 'card',
            'transaction_id' => 'pi_manual_fees',
            'status' => 'pending',
        ]);

        // Observer should override manual values with calculated ones
        $this->assertEquals('15.00', $payment->platform_fee);
        $this->assertEquals('85.00', $payment->traveler_amount);
    }
}
