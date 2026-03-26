<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add held_balance column to track funds that are blocked/escrowed
     * for pending shipments.
     */
    public function up(): void
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->decimal('held_balance', 10, 2)->default(0.00)->after('balance')
                ->comment('Funds held in escrow for pending shipments');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn('held_balance');
        });
    }
};
