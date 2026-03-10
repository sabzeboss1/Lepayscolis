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
        Schema::create('trips', function (Blueprint $table) {
            // 4.1 UUID primary key and foreign key to users (traveler_id)
            $table->uuid('id')->primary();
            $table->foreignId('traveler_id')->constrained('users')->onDelete('cascade')->comment('User who created the trip');
            
            // 4.2 Departure information
            $table->string('departure_city')->comment('City of departure');
            $table->string('departure_country')->comment('Country of departure');
            $table->date('departure_date')->comment('Date of departure');
            
            // 4.3 Arrival information
            $table->string('arrival_city')->comment('City of arrival');
            $table->string('arrival_country')->comment('Country of arrival');
            $table->date('arrival_date')->comment('Date of arrival');
            
            // 4.4 Capacity and pricing
            $table->decimal('available_capacity', 8, 2)->comment('Available capacity in kg (0.1 to 100)');
            $table->decimal('price_per_kg', 8, 2)->comment('Price per kg in EUR (1 to 1000)');
            
            // 4.5 Status enum
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active')->comment('Trip status');
            
            // 4.6 Travel proof URL (nullable)
            $table->string('travel_proof_url')->nullable()->comment('URL to travel proof document in S3');
            
            // 4.8 Timestamps and soft deletes
            $table->timestamps();
            $table->softDeletes();
            
            // 4.7 Indexes for performance
            $table->index(['departure_city', 'arrival_city', 'departure_date'], 'trips_route_date_index');
            $table->index(['status', 'departure_date'], 'trips_status_date_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
