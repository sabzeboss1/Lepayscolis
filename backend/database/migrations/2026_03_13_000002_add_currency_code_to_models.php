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
        Schema::table('users', function (Blueprint $table) {
            $table->string('currency_code', 3)->default('EUR')
                  ->after('locale')
                  ->comment('User preferred currency (ISO 4217)');
        });

        Schema::table('trips', function (Blueprint $table) {
            $table->string('currency_code', 3)->default('EUR')
                  ->after('price_per_kg')
                  ->comment('Currency of price_per_kg (ISO 4217)');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('currency_code', 3)->default('EUR')
                  ->after('traveler_amount')
                  ->comment('Currency of payment amounts (ISO 4217)');
        });

        Schema::table('wallets', function (Blueprint $table) {
            $table->string('currency_code', 3)->default('EUR')
                  ->after('balance')
                  ->comment('Wallet operating currency (ISO 4217)');
        });

        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->string('currency_code', 3)->default('EUR')
                  ->after('balance_after')
                  ->comment('Transaction currency (ISO 4217)');
            $table->decimal('original_amount', 10, 2)->nullable()
                  ->after('currency_code')
                  ->comment('Amount before conversion if cross-currency');
            $table->string('original_currency_code', 3)->nullable()
                  ->after('original_amount')
                  ->comment('Source currency if cross-currency');
            $table->decimal('exchange_rate_used', 16, 6)->nullable()
                  ->after('original_currency_code')
                  ->comment('Exchange rate applied for conversion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropColumn(['currency_code', 'original_amount', 'original_currency_code', 'exchange_rate_used']);
        });

        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn('currency_code');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('currency_code');
        });

        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn('currency_code');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('currency_code');
        });
    }
};
