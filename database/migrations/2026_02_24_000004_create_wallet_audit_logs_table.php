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
        Schema::create('wallet_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('admin_id')->constrained('users')->onDelete('cascade');
            $table->string('action');
            $table->string('target_type');
            $table->string('target_id');
            $table->text('reason');
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index(['admin_id', 'created_at']);
            $table->index(['target_type', 'target_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_audit_logs');
    }
};
