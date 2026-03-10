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
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            // Country and currency information
            $table->string('country_code', 2)->after('net_amount'); // ISO 3166-1 alpha-2
            $table->string('currency', 3)->after('country_code'); // ISO 4217
            
            // Payment method and details (stored as JSON for flexibility)
            $table->string('payment_method')->after('currency'); // 'mobile_money', 'bank_transfer', etc.
            $table->json('payment_details')->after('payment_method'); // Flexible storage for different payment methods
            
            // Indexes
            $table->index('country_code');
            $table->index('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            $table->dropIndex(['country_code']);
            $table->dropIndex(['payment_method']);
            $table->dropColumn(['country_code', 'currency', 'payment_method', 'payment_details']);
        });
    }
};
