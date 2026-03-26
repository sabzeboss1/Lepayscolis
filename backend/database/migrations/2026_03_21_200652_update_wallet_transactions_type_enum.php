<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update enum to include 'hold' and 'hold_cancelled'
        DB::statement("ALTER TABLE wallet_transactions MODIFY COLUMN type ENUM('credit', 'debit', 'hold', 'hold_cancelled', 'refund', 'adjustment') NOT NULL");
    }

    public function down(): void
    {
        // Revert to original enum
        DB::statement("ALTER TABLE wallet_transactions MODIFY COLUMN type ENUM('credit', 'debit', 'refund', 'adjustment') NOT NULL");
    }
};
