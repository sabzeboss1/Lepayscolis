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
        Schema::create('messages', function (Blueprint $table) {
            // 6.3 UUID primary key, conversation_id, sender_id, recipient_id
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained()->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('recipient_id')->constrained('users')->onDelete('cascade');
            
            // 6.4 content (text), read (boolean), read_at (timestamp)
            $table->text('content');
            $table->boolean('read')->default(false);
            $table->timestamp('read_at')->nullable();
            
            // 6.5 indexes on conversation_id, recipient_id, read status
            $table->index(['conversation_id', 'created_at']);
            $table->index(['recipient_id', 'read']);
            
            // 6.6 timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
