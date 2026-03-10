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
        Schema::create('ratings', function (Blueprint $table) {
            // 7.1 UUID primary key, foreign keys to users (from_user_id, to_user_id) and shipments
            $table->uuid('id')->primary();
            $table->foreignId('from_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('to_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('shipment_id')->constrained('shipments')->onDelete('cascade');
            
            // 7.2 rating (tinyInteger 1-5), comment (text, nullable)
            $table->tinyInteger('rating'); // 1-5
            $table->text('comment')->nullable();
            
            // 7.3 unique constraint on from_user_id + to_user_id + shipment_id
            $table->unique(['from_user_id', 'to_user_id', 'shipment_id'], 'ratings_unique');
            
            // 7.4 index on to_user_id and rating
            $table->index(['to_user_id', 'rating']);
            
            // 7.5 timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
