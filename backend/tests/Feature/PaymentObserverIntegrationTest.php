<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Shipment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentObserverIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_observer_calculates_fees_on_creation(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 100.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_integration_test',
            'status' => 'pending',
        ]);

        // Verify observer calculated the fees
        $this->assertEquals('15.00', $payment->platform_fee);
        $this->assertEquals('85.00', $payment->traveler_amount);
        
        // Verify fees are persisted in database
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'platform_fee' => '15.00',
            'traveler_amount' => '85.00',
        ]);
    }

    public function test_payment_observer_handles_decimal_amounts_correctly(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 99.99,
            'payment_method' => 'card',
            'transaction_id' => 'pi_decimal_test',
            'status' => 'pending',
        ]);

        // 15% of 99.99 = 14.9985 (rounded to 15.00)
        // 85% of 99.99 = 84.9915 (rounded to 84.99)
        $this->assertEquals('15.00', $payment->platform_fee);
        $this->assertEquals('84.99', $payment->traveler_amount);
    }

    public function test_payment_observer_works_with_factory(): void
    {
        $payment = Payment::factory()->create([
            'amount' => 200.00,
        ]);

        // Factory should trigger observer
        $this->assertEquals('30.00', $payment->platform_fee);
        $this->assertEquals('170.00', $payment->traveler_amount);
    }

    public function test_payment_observer_calculates_fees_for_multiple_payments(): void
    {
        $shipment1 = Shipment::factory()->accepted()->create();
        $shipment2 = Shipment::factory()->accepted()->create();
        $shipment3 = Shipment::factory()->accepted()->create();

        $payment1 = Payment::create([
            'shipment_id' => $shipment1->id,
            'payer_id' => $shipment1->sender_id,
            'payee_id' => $shipment1->traveler_id,
            'amount' => 50.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_multi_1',
            'status' => 'pending',
        ]);

        $payment2 = Payment::create([
            'shipment_id' => $shipment2->id,
            'payer_id' => $shipment2->sender_id,
            'payee_id' => $shipment2->traveler_id,
            'amount' => 150.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_multi_2',
            'status' => 'pending',
        ]);

        $payment3 = Payment::create([
            'shipment_id' => $shipment3->id,
            'payer_id' => $shipment3->sender_id,
            'payee_id' => $shipment3->traveler_id,
            'amount' => 300.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_multi_3',
            'status' => 'pending',
        ]);

        // Verify each payment has correct fees
        $this->assertEquals('7.50', $payment1->platform_fee);
        $this->assertEquals('42.50', $payment1->traveler_amount);

        $this->assertEquals('22.50', $payment2->platform_fee);
        $this->assertEquals('127.50', $payment2->traveler_amount);

        $this->assertEquals('45.00', $payment3->platform_fee);
        $this->assertEquals('255.00', $payment3->traveler_amount);
    }

    public function test_payment_observer_does_not_recalculate_on_update(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 100.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_update_test',
            'status' => 'pending',
        ]);

        $this->assertEquals('15.00', $payment->platform_fee);
        $this->assertEquals('85.00', $payment->traveler_amount);

        // Update status (should not recalculate fees)
        $payment->update(['status' => 'escrowed']);

        $this->assertEquals('15.00', $payment->platform_fee);
        $this->assertEquals('85.00', $payment->traveler_amount);
    }

    public function test_payment_observer_handles_edge_case_amounts(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        // Test with very small amount
        $payment1 = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 0.10,
            'payment_method' => 'card',
            'transaction_id' => 'pi_small',
            'status' => 'pending',
        ]);

        $this->assertEquals('0.02', $payment1->platform_fee);
        $this->assertEquals('0.09', $payment1->traveler_amount);

        // Test with large amount
        $payment2 = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 9999.99,
            'payment_method' => 'card',
            'transaction_id' => 'pi_large',
            'status' => 'pending',
        ]);

        $this->assertEquals('1500.00', $payment2->platform_fee);
        $this->assertEquals('8499.99', $payment2->traveler_amount);
    }

    public function test_payment_observer_registered_in_service_provider(): void
    {
        // This test verifies that the observer is properly registered
        // by creating a payment and checking if the observer logic executed
        $shipment = Shipment::factory()->accepted()->create();
        
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'amount' => 100.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_observer_registered',
            'status' => 'pending',
        ]);

        // If observer is not registered, these would be null
        $this->assertNotNull($payment->platform_fee);
        $this->assertNotNull($payment->traveler_amount);
        $this->assertEquals('15.00', $payment->platform_fee);
        $this->assertEquals('85.00', $payment->traveler_amount);
    }

    public function test_payment_observer_maintains_15_85_split(): void
    {
        $shipment = Shipment::factory()->accepted()->create();
        
        // Use amounts that don't have rounding issues
        $testAmounts = [10.00, 100.00, 200.00, 500.00, 1000.00];

        foreach ($testAmounts as $amount) {
            $payment = Payment::create([
                'shipment_id' => $shipment->id,
                'payer_id' => $shipment->sender_id,
                'payee_id' => $shipment->traveler_id,
                'amount' => $amount,
                'payment_method' => 'card',
                'transaction_id' => 'pi_split_' . str_replace('.', '_', $amount),
                'status' => 'pending',
            ]);

            $platformFee = (float) $payment->platform_fee;
            $travelerAmount = (float) $payment->traveler_amount;
            
            // Verify 15% platform fee
            $expectedPlatformFee = $amount * 0.15;
            $this->assertEquals($expectedPlatformFee, $platformFee, '', 0.01);
            
            // Verify 85% traveler amount
            $expectedTravelerAmount = $amount * 0.85;
            $this->assertEquals($expectedTravelerAmount, $travelerAmount, '', 0.01);
            
            // Verify sum equals original amount
            $this->assertEquals($amount, $platformFee + $travelerAmount, '', 0.01);
        }
    }
}
