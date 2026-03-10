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
        Schema::table('trips', function (Blueprint $table) {
            // Types de colis acceptés (JSON array)
            $table->json('accepted_package_types')->nullable()->after('price_per_kg')
                ->comment('Types de colis acceptés: enveloppes, petits_colis, moyens_colis, grands_colis');
            
            // Adresse de ramassage des colis
            $table->text('pickup_address')->nullable()->after('accepted_package_types')
                ->comment('Adresse complète de ramassage des colis');
            
            // Adresse de livraison
            $table->text('delivery_address')->nullable()->after('pickup_address')
                ->comment('Adresse complète de livraison des colis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn(['accepted_package_types', 'pickup_address', 'delivery_address']);
        });
    }
};
