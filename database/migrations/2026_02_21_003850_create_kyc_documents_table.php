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
        Schema::create('kyc_documents', function (Blueprint $table) {
            // 8.1 UUID primary key, foreign key to users
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // 8.2 document_type enum (passport, idCard, driversLicense)
            $table->enum('document_type', ['passport', 'idCard', 'driversLicense']);
            
            // 8.3 document_front_url, document_back_url (nullable), selfie_url
            $table->string('document_front_url');
            $table->string('document_back_url')->nullable();
            $table->string('selfie_url');
            
            // 8.4 status enum (pending, approved, rejected), rejection_reason (text, nullable)
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            
            // 8.5 submitted_at, reviewed_at (nullable), reviewed_by (foreign key to users, nullable)
            $table->timestamp('submitted_at');
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            
            // 8.6 index on user_id and status
            $table->index(['user_id', 'status']);
            
            // 8.7 timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kyc_documents');
    }
};
