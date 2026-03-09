<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin
        User::firstOrCreate(
            ['email' => 'superadmin@lepaysexpresscolis.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('super123'),
                'phone' => '+33600000001',
                'role' => 'super_admin',
                'kyc_status' => 'approved',
                'rating' => 5.0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'fr',
            ]
        );

        // Create Regular Admin
        User::firstOrCreate(
            ['email' => 'admin@lepaysexpresscolis.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'phone' => '+33600000002',
                'role' => 'admin',
                'kyc_status' => 'approved',
                'rating' => 5.0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'fr',
            ]
        );

        $this->command->info('Admin users created successfully!');
        $this->command->info('Super Admin: superadmin@lepaysexpresscolis.com / super123');
        $this->command->info('Admin: admin@lepaysexpresscolis.com / admin123');
    }
}
