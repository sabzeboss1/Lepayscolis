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
            // Drop the unique constraint first
            $table->dropUnique('users_phone_unique');
        });
        
        Schema::table('users', function (Blueprint $table) {
            // Make phone nullable and add back unique constraint
            $table->string('phone')->nullable()->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the unique constraint first
            $table->dropUnique('users_phone_unique');
        });
        
        Schema::table('users', function (Blueprint $table) {
            // Revert phone to NOT NULL
            $table->string('phone')->nullable(false)->unique()->change();
        });
    }
};
