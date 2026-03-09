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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->onDelete('cascade');
            $table->string('action', 50); // create, update, delete, approve, reject, cancel
            $table->string('resource_type', 50); // user, trip, shipment, kyc, payment, withdrawal, setting
            $table->unsignedBigInteger('resource_id');
            $table->string('ip_address', 45);
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->timestamp('created_at');

            // Indexes for performance
            $table->index('admin_id');
            $table->index(['resource_type', 'resource_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
