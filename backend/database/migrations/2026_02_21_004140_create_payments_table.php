<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            // 9.1 UUID primary key, foreign key to shipments
            $table->uuid('id')->primary();
            $table->foreignUuid('shipment_id')->constrained()->onDelete('cascade');
            
            // 9.2 payer_id, payee_id (foreign keys to users)
            $table->foreignId('payer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('payee_id')->constrained('users')->onDelete('cascade');
            
            // 9.3 amount, platform_fee, traveler_amount (decimals)
            $table->decimal('amount', 10, 2);
            $table->decimal('platform_fee', 10, 2); // 15%
            $table->decimal('traveler_amount', 10, 2); // 85%
            
            // 9.4 payment_method (string), transaction_id (unique)
            $table->string('payment_method'); // 'card', 'mobile_money'
            $table->string('transaction_id')->unique(); // Stripe PaymentIntent ID
            
            // 9.5 status enum (pending, processing, escrowed, released, refunded, failed)
            $table->enum('status', ['pending', 'processing', 'escrowed', 'released', 'refunded', 'failed'])->default('pending');
            
            // 9.6 escrowed_at, released_at (timestamps, nullable)
            $table->timestamp('escrowed_at')->nullable();
            $table->timestamp('released_at')->nullable();
            
            // 9.7 index on shipment_id, status, transaction_id
            $table->index(['shipment_id', 'status']);
            $table->index(['transaction_id']);
            
            // 9.8 timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
