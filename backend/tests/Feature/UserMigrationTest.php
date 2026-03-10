<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UserMigrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that users table has all required columns.
     */
    public function test_users_table_has_required_columns(): void
    {
        $columns = Schema::getColumnListing('users');
        
        $requiredColumns = [
            'id',
            'name',
            'email',
            'password',
            'phone',
            'avatar',
            'rating',
            'completed_deliveries',
            'is_recommended',
            'kyc_status',
            'locale',
            'fcm_token',
            'email_verified_at',
            'remember_token',
            'created_at',
            'updated_at',
            'deleted_at',
        ];
        
        foreach ($requiredColumns as $column) {
            $this->assertContains($column, $columns, "Column '{$column}' is missing from users table");
        }
    }

    /**
     * Test that user can be created with all required fields.
     */
    public function test_user_can_be_created_with_all_fields(): void
    {
        $user = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+33612345678',
            'avatar' => 'avatars/john.jpg',
            'rating' => 4.75,
            'completed_deliveries' => 10,
            'is_recommended' => true,
            'kyc_status' => 'approved',
            'locale' => 'en',
            'fcm_token' => 'test_fcm_token_123',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'phone' => '+33612345678',
            'rating' => 4.75,
            'completed_deliveries' => 10,
            'is_recommended' => 1,
            'kyc_status' => 'approved',
            'locale' => 'en',
        ]);
    }

    /**
     * Test that default values are set correctly.
     */
    public function test_user_default_values_are_set_correctly(): void
    {
        $user = User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+33687654321',
        ]);

        // Refresh to get values from database
        $user->refresh();

        $this->assertEquals(0, $user->rating);
        $this->assertEquals(0, $user->completed_deliveries);
        $this->assertEquals(false, $user->is_recommended);
        $this->assertEquals('pending', $user->kyc_status);
        $this->assertEquals('fr', $user->locale);
    }

    /**
     * Test that email must be unique.
     */
    public function test_email_must_be_unique(): void
    {
        User::create([
            'name' => 'User One',
            'email' => 'duplicate@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+33611111111',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        User::create([
            'name' => 'User Two',
            'email' => 'duplicate@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+33622222222',
        ]);
    }

    /**
     * Test that phone must be unique.
     */
    public function test_phone_must_be_unique(): void
    {
        User::create([
            'name' => 'User One',
            'email' => 'user1@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+33633333333',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        User::create([
            'name' => 'User Two',
            'email' => 'user2@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+33633333333',
        ]);
    }

    /**
     * Test that soft delete works correctly.
     */
    public function test_user_can_be_soft_deleted(): void
    {
        $user = User::create([
            'name' => 'Delete Me',
            'email' => 'delete@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+33644444444',
        ]);

        $userId = $user->id;
        $user->delete();

        // User should not be found in normal queries
        $this->assertNull(User::find($userId));

        // User should be found with trashed
        $this->assertNotNull(User::withTrashed()->find($userId));
        
        // deleted_at should be set
        $trashedUser = User::withTrashed()->find($userId);
        $this->assertNotNull($trashedUser->deleted_at);
    }

    /**
     * Test that rating is stored as decimal with 2 decimal places.
     */
    public function test_rating_is_decimal_with_two_decimal_places(): void
    {
        $user = User::create([
            'name' => 'Rating Test',
            'email' => 'rating@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+33655555555',
            'rating' => 4.567, // Should be stored as 4.57
        ]);

        $this->assertEquals('4.57', number_format($user->rating, 2));
    }

    /**
     * Test that kyc_status accepts valid enum values.
     */
    public function test_kyc_status_accepts_valid_enum_values(): void
    {
        $validStatuses = ['pending', 'approved', 'rejected'];
        $phoneNumbers = ['+33666666661', '+33666666662', '+33666666663'];

        foreach ($validStatuses as $index => $status) {
            $user = User::create([
                'name' => "User {$status}",
                'email' => "{$status}@example.com",
                'password' => bcrypt('password123'),
                'phone' => $phoneNumbers[$index],
                'kyc_status' => $status,
            ]);

            $this->assertEquals($status, $user->kyc_status);
        }
    }

    /**
     * Test that locale accepts valid values (fr or en).
     */
    public function test_locale_accepts_valid_values(): void
    {
        $userFr = User::create([
            'name' => 'French User',
            'email' => 'french@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+33677777777',
            'locale' => 'fr',
        ]);

        $userEn = User::create([
            'name' => 'English User',
            'email' => 'english@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+33688888888',
            'locale' => 'en',
        ]);

        $this->assertEquals('fr', $userFr->locale);
        $this->assertEquals('en', $userEn->locale);
    }

    /**
     * Test that indexes exist on the users table.
     */
    public function test_users_table_has_required_indexes(): void
    {
        // For SQLite, we can check indexes using PRAGMA
        $connection = Schema::getConnection();
        
        if ($connection->getDriverName() === 'sqlite') {
            $indexes = $connection->select('PRAGMA index_list(users)');
            $indexNames = array_map(fn($index) => $index->name, $indexes);
            
            // Check for email unique index
            $this->assertContains('users_email_unique', $indexNames, 'Email unique index is missing');
            
            // Check for phone unique index
            $this->assertContains('users_phone_unique', $indexNames, 'Phone unique index is missing');
            
            // Check for composite index on email and kyc_status
            $this->assertContains('users_email_kyc_status_index', $indexNames, 'Email and KYC status composite index is missing');
        } else {
            // For MySQL/PostgreSQL
            $indexes = Schema::getConnection()
                ->getDoctrineSchemaManager()
                ->listTableIndexes('users');

            $indexNames = array_keys($indexes);

            $this->assertTrue(in_array('users_email_unique', $indexNames), 'Email unique index is missing');
            $this->assertTrue(in_array('users_phone_unique', $indexNames), 'Phone unique index is missing');
            $this->assertTrue(in_array('users_email_kyc_status_index', $indexNames), 'Email and KYC status composite index is missing');
        }
    }
}
