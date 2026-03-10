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
        Schema::create('notifications', function (Blueprint $table) {
            // 10.1 UUID primary key, foreign key to users (recipient)
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // 10.2 type (string), title, body (text)
            $table->string('type');
            $table->string('title');
            $table->text('body');
            
            // 10.3 data (json), read_at (timestamp, nullable)
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            
            // 10.4 index on user_id and read_at
            $table->index(['user_id', 'read_at']);
            
            // 10.5 timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
