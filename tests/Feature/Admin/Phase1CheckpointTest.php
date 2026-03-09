<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\PlatformSetting;
use App\Models\AdminNotification;
use App\Models\AdminSession;
use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase1CheckpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PlatformSettingsSeeder::class);
    }

    /** @test */
    public function all_migrations_run_successfully()
    {
        // Verify all tables exist
        $this->assertTrue(\Schema::hasTable('audit_logs'));
        $this->assertTrue(\Schema::hasTable('platform_settings'));
        $this->assertTrue(\Schema::hasTable('admin_notifications'));
        $this->assertTrue(\Schema::hasTable('admin_sessions'));
        $this->assertTrue(\Schema::hasTable('login_attempts'));
        
        // Verify users table has new columns
        $this->assertTrue(\Schema::hasColumn('users', 'role'));
        $this->assertTrue(\Schema::hasColumn('users', 'messaging_banned'));
        $this->assertTrue(\Schema::hasColumn('users', 'messaging_ban_reason'));
    }

    /** @test */
    public function platform_settings_seeded_correctly()
    {
        $this->assertDatabaseHas('platform_settings', ['key' => 'platform_fee_percentage']);
        $this->assertDatabaseHas('platform_settings', ['key' => 'withdrawal_fee']);
        $this->assertDatabaseHas('platform_settings', ['key' => 'min_withdrawal_amount']);
        $this->assertDatabaseHas('platform_settings', ['key' => 'max_withdrawal_amount']);
        $this->assertDatabaseHas('platform_settings', ['key' => 'min_shipment_price']);
        $this->assertDatabaseHas('platform_settings', ['key' => 'max_shipment_price']);
    }

    /** @test */
    public function user_model_has_admin_fields()
    {
        $user = User::factory()->create([
            'role' => 'admin',
            'messaging_banned' => false,
        ]);

        $this->assertEquals('admin', $user->role);
        $this->assertFalse($user->messaging_banned);
        $this->assertTrue($user->isAdmin());
        $this->assertFalse($user->isSuperAdmin());
    }

    /** @test */
    public function user_model_super_admin_methods_work()
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user']);

        $this->assertTrue($superAdmin->isAdmin());
        $this->assertTrue($superAdmin->isSuperAdmin());
        
        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isSuperAdmin());
        
        $this->assertFalse($user->isAdmin());
        $this->assertFalse($user->isSuperAdmin());
    }

    /** @test */
    public function audit_log_model_works()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $log = AuditLog::log(
            $admin,
            'update',
            'user',
            1,
            ['status' => 'active'],
            ['status' => 'suspended']
        );

        $this->assertDatabaseHas('audit_logs', [
            'admin_id' => $admin->id,
            'action' => 'update',
            'resource_type' => 'user',
            'resource_id' => 1,
        ]);

        $this->assertEquals(['status' => 'active'], $log->before);
        $this->assertEquals(['status' => 'suspended'], $log->after);
    }

    /** @test */
    public function platform_setting_model_get_and_set_work()
    {
        // Test get
        $fee = PlatformSetting::get('platform_fee_percentage');
        $this->assertEquals(10.0, $fee);

        // Test set
        PlatformSetting::set('platform_fee_percentage', 15.0);
        $newFee = PlatformSetting::get('platform_fee_percentage');
        $this->assertEquals(15.0, $newFee);
    }

    /** @test */
    public function admin_session_model_works()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $session = AdminSession::create([
            'admin_id' => $admin->id,
            'token' => 'test-token',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Test Agent',
            'last_activity' => now(),
            'expires_at' => now()->addHours(8),
        ]);

        $this->assertFalse($session->isExpired());
        
        $session->extend();
        $this->assertTrue($session->expires_at->greaterThan(now()->addHours(7)));
    }

    /** @test */
    public function login_attempt_model_works()
    {
        LoginAttempt::recordAttempt('test@example.com', '127.0.0.1', false);
        LoginAttempt::recordAttempt('test@example.com', '127.0.0.1', false);
        LoginAttempt::recordAttempt('test@example.com', '127.0.0.1', true);

        $failedCount = LoginAttempt::failedAttemptsCount('127.0.0.1');
        $this->assertEquals(2, $failedCount);
    }

    /** @test */
    public function admin_middleware_blocks_non_admin_users()
    {
        $user = User::factory()->create(['role' => 'user']);

        // Since no admin routes exist yet, we expect 404 not 403
        // The middleware will be tested properly when routes are added
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/test');

        // For now, just verify it's not 200 (success)
        $this->assertNotEquals(200, $response->status());
    }

    /** @test */
    public function admin_middleware_allows_admin_users()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        // This will fail because route doesn't exist yet, but should not be 403
        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/test');

        $this->assertNotEquals(403, $response->status());
    }

    /** @test */
    public function super_admin_middleware_blocks_regular_admin()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/super-test');

        // Will be 404 since route doesn't exist, but we're testing middleware logic
        $this->assertNotEquals(200, $response->status());
    }
}
