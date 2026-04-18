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
        Schema::table('shipments', function (Blueprint $table) {
            // Add reference to shipment request
            $table->foreignUuid('shipment_request_id')->nullable()->after('trip_id')->constrained('shipment_requests')->onDelete('set null');
            
            // Add missing fields from shipment request
            $table->string('title')->nullable()->after('shipment_request_id');
            $table->text('description')->nullable()->after('title');
            $table->decimal('declared_value', 10, 2)->nullable()->after('package_height');
            $table->string('package_type')->nullable()->after('declared_value');
            $table->json('photo_urls')->nullable()->after('package_type');
            $table->string('recipient_name')->nullable()->after('photo_urls');
            $table->string('recipient_phone')->nullable()->after('recipient_name');
            $table->string('currency_code', 3)->nullable()->after('payment_status');
            $table->datetime('pickup_date')->nullable()->after('currency_code');
            $table->datetime('delivery_date')->nullable()->after('pickup_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropForeign(['shipment_request_id']);
            $table->dropColumn([
                'shipment_request_id',
                'title',
                'description',
                'declared_value',
                'package_type',
                'photo_urls',
                'recipient_name',
                'recipient_phone',
                'currency_code',
                'pickup_date',
                'delivery_date',
            ]);
        });
    }
};