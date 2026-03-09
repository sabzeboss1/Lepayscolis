<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlatformSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'platform_fee_percentage',
                'value' => '10.0',
                'type' => 'float',
                'description' => 'Platform commission percentage on transactions (0-100)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'withdrawal_fee',
                'value' => '2.50',
                'type' => 'float',
                'description' => 'Fixed fee charged for withdrawal requests',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'min_withdrawal_amount',
                'value' => '20.00',
                'type' => 'float',
                'description' => 'Minimum amount allowed for withdrawal',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'max_withdrawal_amount',
                'value' => '5000.00',
                'type' => 'float',
                'description' => 'Maximum amount allowed for withdrawal',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'min_shipment_price',
                'value' => '10.00',
                'type' => 'float',
                'description' => 'Minimum price allowed for shipments',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'max_shipment_price',
                'value' => '1000.00',
                'type' => 'float',
                'description' => 'Maximum price allowed for shipments',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('platform_settings')->insert($settings);
    }
}
