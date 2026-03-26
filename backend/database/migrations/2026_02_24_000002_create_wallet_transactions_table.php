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
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['credit', 'debit', 'hold', 'hold_cancelled', 'refund', 'adjustment']);
            $table->decimal('amount', 10, 2);
            $table->text('description');
            $table->string('reference_type')->nullable();
            $table->string('reference_id')->nullable();
            $table->decimal('balance_after', 10, 2);
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index(['wallet_id', 'created_at']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
