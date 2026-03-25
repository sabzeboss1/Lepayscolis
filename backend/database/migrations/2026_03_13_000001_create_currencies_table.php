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
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 3)->unique()->comment('ISO 4217 currency code');
            $table->string('symbol', 10)->comment('Display symbol (e.g. €, $, FCFA)');
            $table->string('name')->comment('Full name (e.g. Euro, US Dollar)');
            $table->decimal('exchange_rate', 16, 6)->comment('Rate relative to base currency');
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('is_base')->default(false)->comment('Only one currency should be base');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
