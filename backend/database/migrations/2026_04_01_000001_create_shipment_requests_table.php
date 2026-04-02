<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('shipment_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            
            // Package details
            $table->string('title');
            $table->text('description');
            $table->decimal('weight', 8, 2);
            $table->decimal('length', 8, 2);
            $table->decimal('width', 8, 2);
            $table->decimal('height', 8, 2);
            $table->decimal('declared_value', 10, 2);
            $table->string('package_type');
            $table->json('photo_urls')->nullable();
            
            // Recipient info
            $table->string('recipient_name');
            $table->string('recipient_phone');
            
            // Locations
            $table->foreignId('pickup_country_id')->constrained('countries');
            $table->foreignId('pickup_city_id')->constrained('cities');
            $table->text('pickup_address');
            $table->foreignId('delivery_country_id')->constrained('countries');
            $table->foreignId('delivery_city_id')->constrained('cities');
            $table->text('delivery_address');
            
            // Pricing
            $table->decimal('max_budget', 10, 2)->nullable(); // Budget maximum de l'expéditeur
            $table->string('currency_code', 3)->default('EUR');
            
            // Status
            $table->enum('status', ['open', 'assigned', 'in_transit', 'delivered', 'cancelled'])->default('open');
            $table->foreignId('assigned_traveler_id')->nullable()->constrained('users');
            $table->decimal('agreed_price', 10, 2)->nullable();
            
            // Dates
            $table->timestamp('needed_by')->nullable(); // Date limite souhaitée
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['status', 'pickup_country_id', 'delivery_country_id']);
            $table->index(['sender_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('shipment_requests');
    }
};