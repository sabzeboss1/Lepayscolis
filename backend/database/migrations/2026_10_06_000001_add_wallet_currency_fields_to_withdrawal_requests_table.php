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
            $table->decimal('wallet_amount', 10, 2)->nullable()->after('amount');
            $table->string('wallet_currency', 3)->nullable()->after('wallet_amount');
            $table->decimal('exchange_rate', 16, 6)->nullable()->after('wallet_currency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            $table->dropColumn(['wallet_amount', 'wallet_currency', 'exchange_rate']);
        });
    }
};
