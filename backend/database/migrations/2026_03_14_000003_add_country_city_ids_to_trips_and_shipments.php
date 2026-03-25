<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->foreignId('departure_country_id')->nullable()->after('traveler_id')
                  ->constrained('countries')->nullOnDelete();
            $table->foreignId('departure_city_id')->nullable()->after('departure_country_id')
                  ->constrained('cities')->nullOnDelete();
            $table->foreignId('arrival_country_id')->nullable()->after('departure_date')
                  ->constrained('countries')->nullOnDelete();
            $table->foreignId('arrival_city_id')->nullable()->after('arrival_country_id')
                  ->constrained('cities')->nullOnDelete();
        });

        Schema::table('shipments', function (Blueprint $table) {
            $table->foreignId('pickup_country_id')->nullable()->after('package_height')
                  ->constrained('countries')->nullOnDelete();
            $table->foreignId('pickup_city_id')->nullable()->after('pickup_country_id')
                  ->constrained('cities')->nullOnDelete();
            $table->foreignId('delivery_country_id')->nullable()->after('pickup_address')
                  ->constrained('countries')->nullOnDelete();
            $table->foreignId('delivery_city_id')->nullable()->after('delivery_country_id')
                  ->constrained('cities')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropConstrainedForeignId('departure_country_id');
            $table->dropConstrainedForeignId('departure_city_id');
            $table->dropConstrainedForeignId('arrival_country_id');
            $table->dropConstrainedForeignId('arrival_city_id');
        });

        Schema::table('shipments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pickup_country_id');
            $table->dropConstrainedForeignId('pickup_city_id');
            $table->dropConstrainedForeignId('delivery_country_id');
            $table->dropConstrainedForeignId('delivery_city_id');
        });
    }
};
