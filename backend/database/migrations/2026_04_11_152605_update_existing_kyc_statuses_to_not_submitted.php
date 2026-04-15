<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For SQLite, we need to recreate the table to modify the ENUM constraint
        // First, update existing users without KYC documents to 'not_submitted'
        DB::table('users')
            ->where('kyc_status', 'pending')
            ->whereNotIn('id', function($query) {
                $query->select('user_id')
                      ->from('kyc_documents');
            })
            ->update(['kyc_status' => 'pending']); // Keep as pending for now
        
        // For SQLite, we need to recreate the table with the new constraint
        // This is a complex operation, so we'll use raw SQL
        
        // Step 1: Create a temporary table with the new structure
        DB::statement('CREATE TABLE users_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            name VARCHAR NOT NULL,
            email VARCHAR NOT NULL,
            email_verified_at DATETIME,
            password VARCHAR NOT NULL,
            phone VARCHAR NOT NULL,
            avatar VARCHAR,
            rating NUMERIC(3, 2) DEFAULT 0 NOT NULL,
            completed_deliveries INTEGER DEFAULT 0 NOT NULL,
            is_recommended TINYINT(1) DEFAULT 0 NOT NULL,
            kyc_status VARCHAR CHECK(kyc_status IN (\'not_submitted\', \'pending\', \'approved\', \'rejected\')) DEFAULT \'not_submitted\' NOT NULL,
            locale VARCHAR(2) DEFAULT \'fr\' NOT NULL,
            currency_code VARCHAR,
            fcm_token VARCHAR,
            role VARCHAR CHECK(role IN (\'user\', \'admin\', \'super_admin\')) DEFAULT \'user\' NOT NULL,
            messaging_banned TINYINT(1) DEFAULT 0 NOT NULL,
            messaging_ban_reason TEXT,
            remember_token VARCHAR,
            created_at DATETIME,
            updated_at DATETIME,
            deleted_at DATETIME
        )');
        
        // Step 2: Copy data from old table to new table
        DB::statement('INSERT INTO users_temp SELECT * FROM users');
        
        // Step 3: Drop old table
        DB::statement('DROP TABLE users');
        
        // Step 4: Rename temp table to users
        DB::statement('ALTER TABLE users_temp RENAME TO users');
        
        // Step 5: Recreate indexes
        DB::statement('CREATE UNIQUE INDEX users_email_unique ON users (email)');
        DB::statement('CREATE UNIQUE INDEX users_phone_unique ON users (phone)');
        DB::statement('CREATE INDEX users_email_kyc_status_index ON users (email, kyc_status)');
        
        // Step 6: Update users without KYC documents to 'not_submitted'
        DB::table('users')
            ->whereNotIn('id', function($query) {
                $query->select('user_id')
                      ->from('kyc_documents');
            })
            ->update(['kyc_status' => 'not_submitted']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate table with old constraint
        DB::statement('CREATE TABLE users_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            name VARCHAR NOT NULL,
            email VARCHAR NOT NULL,
            email_verified_at DATETIME,
            password VARCHAR NOT NULL,
            phone VARCHAR NOT NULL,
            avatar VARCHAR,
            rating NUMERIC(3, 2) DEFAULT 0 NOT NULL,
            completed_deliveries INTEGER DEFAULT 0 NOT NULL,
            is_recommended TINYINT(1) DEFAULT 0 NOT NULL,
            kyc_status VARCHAR CHECK(kyc_status IN (\'pending\', \'approved\', \'rejected\')) DEFAULT \'pending\' NOT NULL,
            locale VARCHAR(2) DEFAULT \'fr\' NOT NULL,
            currency_code VARCHAR,
            fcm_token VARCHAR,
            role VARCHAR CHECK(role IN (\'user\', \'admin\', \'super_admin\')) DEFAULT \'user\' NOT NULL,
            messaging_banned TINYINT(1) DEFAULT 0 NOT NULL,
            messaging_ban_reason TEXT,
            remember_token VARCHAR,
            created_at DATETIME,
            updated_at DATETIME,
            deleted_at DATETIME
        )');
        
        // Update not_submitted back to pending
        DB::table('users')
            ->where('kyc_status', 'not_submitted')
            ->update(['kyc_status' => 'pending']);
        
        DB::statement('INSERT INTO users_temp SELECT * FROM users');
        DB::statement('DROP TABLE users');
        DB::statement('ALTER TABLE users_temp RENAME TO users');
        
        // Recreate indexes
        DB::statement('CREATE UNIQUE INDEX users_email_unique ON users (email)');
        DB::statement('CREATE UNIQUE INDEX users_phone_unique ON users (phone)');
        DB::statement('CREATE INDEX users_email_kyc_status_index ON users (email, kyc_status)');
    }
};
