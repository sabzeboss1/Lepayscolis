<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed admin users first
        $this->call([
            AdminUserSeeder::class,
            PlatformSettingsSeeder::class,
            CurrencySeeder::class,
            CountrySeeder::class,
            DemoUserSeeder::class,
        ]);
    }
}
