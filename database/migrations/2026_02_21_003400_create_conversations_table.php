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
        Schema::create('conversations', function (Blueprint $table) {
            // 6.1 UUID primary key, user1_id, user2_id, shipment_id (nullable)
            $table->uuid('id')->primary();
            $table->foreignId('user1_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('user2_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('shipment_id')->nullable()->constrained('shipments')->onDelete('set null');
            
            // 6.2 unique constraint on user1_id + user2_id
            $table->unique(['user1_id', 'user2_id']);
            $table->index(['user1_id', 'user2_id']);
            
            // 6.6 timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
