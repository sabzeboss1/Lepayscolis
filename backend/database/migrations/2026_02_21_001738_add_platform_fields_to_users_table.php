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
        Schema::table('users', function (Blueprint $table) {
            // Add phone field with unique constraint
            $table->string('phone')->unique()->after('email');
            
            // Add avatar field (nullable)
            $table->string('avatar')->nullable()->after('password');
            
            // Add rating fields
            $table->decimal('rating', 3, 2)->default(0)->after('avatar')->comment('User rating from 0.00 to 5.00');
            $table->integer('completed_deliveries')->default(0)->after('rating')->comment('Number of completed deliveries');
            $table->boolean('is_recommended')->default(false)->after('completed_deliveries')->comment('Recommended user flag (rating >= 4.5 and deliveries >= 5)');
            
            // Add KYC status enum
            $table->enum('kyc_status', ['pending', 'approved', 'rejected'])->default('pending')->after('is_recommended')->comment('KYC verification status');
            
            // Add locale field (fr or en)
            $table->string('locale', 2)->default('fr')->after('kyc_status')->comment('User preferred language: fr or en');
            
            // Add FCM token for push notifications
            $table->string('fcm_token')->nullable()->after('locale')->comment('Firebase Cloud Messaging token for push notifications');
            
            // Add soft deletes
            $table->softDeletes()->after('updated_at');
            
            // Add indexes for performance
            $table->index(['email', 'kyc_status'], 'users_email_kyc_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('users_email_kyc_status_index');
            
            // Drop columns in reverse order
            $table->dropSoftDeletes();
            $table->dropColumn([
                'fcm_token',
                'locale',
                'kyc_status',
                'is_recommended',
                'completed_deliveries',
                'rating',
                'avatar',
                'phone',
            ]);
        });
    }
};
