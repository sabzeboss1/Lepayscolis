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
        Schema::table('audit_logs', function (Blueprint $table) {
            // Drop the index first
            $table->dropIndex(['resource_type', 'resource_id']);
            
            // Modify the column type
            $table->string('resource_id', 100)->change();
            
            // Recreate the index
            $table->index(['resource_type', 'resource_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Drop the index first
            $table->dropIndex(['resource_type', 'resource_id']);
            
            // Revert to unsignedBigInteger
            $table->unsignedBigInteger('resource_id')->change();
            
            // Recreate the index
            $table->index(['resource_type', 'resource_id']);
        });
    }
};
