<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('shipment_bids', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shipment_request_id')->constrained('shipment_requests')->onDelete('cascade');
            $table->foreignId('traveler_id')->constrained('users')->onDelete('cascade');
            
            // Bid details
            $table->decimal('proposed_price', 10, 2);
            $table->string('currency_code', 3)->default('EUR');
            $table->text('message')->nullable(); // Message du voyageur
            
            // Trip reference (optionnel - si le voyageur a un voyage planifié)
            $table->foreignUuid('trip_id')->nullable()->constrained('trips');
            
            // Dates proposées
            $table->timestamp('proposed_pickup_date');
            $table->timestamp('proposed_delivery_date');
            
            // Status
            $table->enum('status', ['pending', 'accepted', 'rejected', 'withdrawn'])->default('pending');
            $table->timestamp('responded_at')->nullable();
            
            $table->timestamps();
            
            $table->unique(['shipment_request_id', 'traveler_id']); // Un voyageur ne peut soumissionner qu'une fois
            $table->index(['shipment_request_id', 'status']);
            $table->index(['traveler_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('shipment_bids');
    }
};