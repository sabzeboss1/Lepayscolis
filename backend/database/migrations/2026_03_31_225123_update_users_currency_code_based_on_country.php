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
        // Since users table doesn't store country_code, we'll set a reasonable default
        // for existing users who might have NULL or empty currency_code
        
        DB::statement("
            UPDATE users 
            SET currency_code = 'EUR' 
            WHERE currency_code IS NULL 
            OR currency_code = ''
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert currency_code to EUR for all users
        DB::statement("UPDATE users SET currency_code = 'EUR'");
    }
};
