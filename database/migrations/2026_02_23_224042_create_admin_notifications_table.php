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
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sent_by')->constrained('users')->onDelete('cascade');
            $table->enum('recipient_type', ['individual', 'broadcast', 'group']);
            $table->integer('recipient_count')->default(0);
            $table->string('title', 100);
            $table->text('message');
            $table->json('group_filter')->nullable();
            $table->timestamp('sent_at');

            // Indexes for performance
            $table->index('sent_by');
            $table->index('sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};
