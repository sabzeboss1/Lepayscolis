<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add base_amount, sender_fee, traveler_fee columns for double commission model.
     * - base_amount = package_weight * price_per_kg (traveler's listed price)
     * - sender_fee = base_amount * sender_fee_% (added to what sender pays)
     * - traveler_fee = base_amount * traveler_fee_% (deducted from traveler's share)
     * - amount = base_amount + sender_fee (total charged to sender)
     * - platform_fee = sender_fee + traveler_fee (total platform revenue)
     * - traveler_amount = base_amount - traveler_fee (what traveler receives)
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('base_amount', 10, 2)->default(0)->after('amount');
            $table->decimal('sender_fee', 10, 2)->default(0)->after('base_amount');
            $table->decimal('traveler_fee', 10, 2)->default(0)->after('sender_fee');
        });

        // Backfill existing records:
        // Old model: amount = base price, platform_fee = 15% of amount, traveler_amount = 85%
        // New model: base_amount = old amount, sender_fee = 0, traveler_fee = old platform_fee
        DB::table('payments')->update([
            'base_amount' => DB::raw('amount'),
            'sender_fee' => 0,
            'traveler_fee' => DB::raw('platform_fee'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['base_amount', 'sender_fee', 'traveler_fee']);
        });
    }
};
