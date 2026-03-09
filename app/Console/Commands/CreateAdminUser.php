<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create 
                            {--email= : Admin email address}
                            {--password= : Admin password}
                            {--name= : Admin name}
                            {--super : Create as super admin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new admin user';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Creating admin user...');
        $this->newLine();

        // Get email
        $email = $this->option('email') ?: $this->ask('Email address');
        
        // Validate email
        $validator = Validator::make(['email' => $email], [
            'email' => 'required|email|unique:users,email',
        ]);

        if ($validator->fails()) {
            $this->error('Invalid email: ' . $validator->errors()->first('email'));
            return self::FAILURE;
        }

        // Get name
        $name = $this->option('name') ?: $this->ask('Name');

        // Get password
        $password = $this->option('password') ?: $this->secret('Password (min 8 characters)');
        
        if (strlen($password) < 8) {
            $this->error('Password must be at least 8 characters long');
            return self::FAILURE;
        }

        // Determine role
        $isSuper = $this->option('super');
        if (!$isSuper && !$this->option('email') && !$this->option('password')) {
            $isSuper = $this->confirm('Create as super admin?', false);
        }
        
        $role = $isSuper ? 'super_admin' : 'admin';

        // Create user
        try {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'phone' => '+33600000000', // Placeholder phone
                'role' => $role,
                'kyc_status' => 'approved',
                'rating' => 5.0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'fr',
            ]);

            $this->newLine();
            $this->info('✓ Admin user created successfully!');
            $this->newLine();
            $this->table(
                ['Field', 'Value'],
                [
                    ['ID', $user->id],
                    ['Name', $user->name],
                    ['Email', $user->email],
                    ['Role', $user->role],
                    ['KYC Status', $user->kyc_status],
                ]
            );

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to create admin user: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
