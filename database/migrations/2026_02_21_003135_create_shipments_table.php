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
        Schema::create('shipments', function (Blueprint $table) {
            // 5.1 UUID primary key, foreign keys to users (sender_id, traveler_id) and trips
            $table->uuid('id')->primary();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('traveler_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignUuid('trip_id')->nullable()->constrained('trips')->onDelete('set null');
            
            // 5.2 package_description, package_weight, package dimensions (length, width, height)
            $table->string('package_description', 500);
            $table->decimal('package_weight', 8, 2); // kg
            $table->integer('package_length')->nullable(); // cm
            $table->integer('package_width')->nullable(); // cm
            $table->integer('package_height')->nullable(); // cm
            
            // 5.3 pickup_city, pickup_country, pickup_address
            $table->string('pickup_city');
            $table->string('pickup_country');
            $table->text('pickup_address');
            
            // 5.4 delivery_city, delivery_country, delivery_address
            $table->string('delivery_city');
            $table->string('delivery_country');
            $table->text('delivery_address');
            
            // 5.5 status enum (pending, accepted, in_transit, delivered, cancelled)
            $table->enum('status', ['pending', 'accepted', 'in_transit', 'delivered', 'cancelled'])->default('pending');
            
            // 5.6 payment_amount (decimal), payment_status enum
            $table->decimal('payment_amount', 10, 2);
            $table->enum('payment_status', ['pending', 'processing', 'escrowed', 'released', 'refunded'])->default('pending');
            
            // 5.7 indexes on sender_id, traveler_id, status
            $table->index(['sender_id', 'status']);
            $table->index(['traveler_id', 'status']);
            $table->index(['status', 'created_at']);
            
            // 5.8 timestamps and soft deletes
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
