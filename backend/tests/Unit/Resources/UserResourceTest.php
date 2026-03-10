<?php

namespace Tests\Unit\Resources;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test UserResource transformation
 * 
 * Validates Requirements: 10.3, 12.14
 */
class UserResourceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test UserResource includes all user fields including sensitive data
     * 
     * @return void
     */
    public function test_user_resource_includes_all_fields(): void
    {
        // Create a user with all fields
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '+33612345678',
            'avatar' => 'https://example.com/avatar.jpg',
            'rating' => 4.75,
            'completed_deliveries' => 10,
            'is_recommended' => true,
            'kyc_status' => 'approved',
            'locale' => 'fr',
        ]);

        // Transform using UserResource
        $resource = new UserResource($user);
        $array = $resource->toArray(request());

        // Assert all fields are present
        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('name', $array);
        $this->assertArrayHasKey('email', $array);
        $this->assertArrayHasKey('phone', $array);
        $this->assertArrayHasKey('avatar', $array);
        $this->assertArrayHasKey('rating', $array);
        $this->assertArrayHasKey('completed_deliveries', $array);
        $this->assertArrayHasKey('is_recommended', $array);
        $this->assertArrayHasKey('kyc_status', $array);
        $this->assertArrayHasKey('locale', $array);
        $this->assertArrayHasKey('created_at', $array);
        $this->assertArrayHasKey('updated_at', $array);

        // Assert values are correct
        $this->assertEquals($user->id, $array['id']);
        $this->assertEquals('John Doe', $array['name']);
        $this->assertEquals('john@example.com', $array['email']);
        $this->assertEquals('+33612345678', $array['phone']);
        $this->assertEquals('https://example.com/avatar.jpg', $array['avatar']);
        $this->assertEquals(4.75, $array['rating']);
        $this->assertEquals(10, $array['completed_deliveries']);
        $this->assertTrue($array['is_recommended']);
        $this->assertEquals('approved', $array['kyc_status']);
        $this->assertEquals('fr', $array['locale']);
    }

    /**
     * Test UserResource includes sensitive fields (email, phone, kyc_status)
     * 
     * @return void
     */
    public function test_user_resource_includes_sensitive_fields(): void
    {
        $user = User::factory()->create([
            'email' => 'sensitive@example.com',
            'phone' => '+33698765432',
            'kyc_status' => 'pending',
        ]);

        $resource = new UserResource($user);
        $array = $resource->toArray(request());

        // Assert sensitive fields are included
        $this->assertEquals('sensitive@example.com', $array['email']);
        $this->assertEquals('+33698765432', $array['phone']);
        $this->assertEquals('pending', $array['kyc_status']);
    }

    /**
     * Test UserResource formats dates as ISO 8601
     * 
     * @return void
     */
    public function test_user_resource_formats_dates_as_iso8601(): void
    {
        $user = User::factory()->create();

        $resource = new UserResource($user);
        $array = $resource->toArray(request());

        // Assert dates are formatted as ISO 8601
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/',
            $array['created_at']
        );
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/',
            $array['updated_at']
        );
    }

    /**
     * Test UserResource handles null avatar
     * 
     * @return void
     */
    public function test_user_resource_handles_null_avatar(): void
    {
        $user = User::factory()->create([
            'avatar' => null,
        ]);

        $resource = new UserResource($user);
        $array = $resource->toArray(request());

        $this->assertNull($array['avatar']);
    }

    /**
     * Test UserResource with different KYC statuses
     * 
     * @return void
     */
    public function test_user_resource_with_different_kyc_statuses(): void
    {
        $statuses = ['pending', 'approved', 'rejected'];

        foreach ($statuses as $status) {
            $user = User::factory()->create([
                'kyc_status' => $status,
            ]);

            $resource = new UserResource($user);
            $array = $resource->toArray(request());

            $this->assertEquals($status, $array['kyc_status']);
        }
    }

    /**
     * Test UserResource with different locales
     * 
     * @return void
     */
    public function test_user_resource_with_different_locales(): void
    {
        $locales = ['fr', 'en'];

        foreach ($locales as $locale) {
            $user = User::factory()->create([
                'locale' => $locale,
            ]);

            $resource = new UserResource($user);
            $array = $resource->toArray(request());

            $this->assertEquals($locale, $array['locale']);
        }
    }

    /**
     * Test UserResource with recommended user
     * 
     * @return void
     */
    public function test_user_resource_with_recommended_user(): void
    {
        $user = User::factory()->create([
            'rating' => 4.8,
            'completed_deliveries' => 15,
            'is_recommended' => true,
        ]);

        $resource = new UserResource($user);
        $array = $resource->toArray(request());

        $this->assertTrue($array['is_recommended']);
        $this->assertGreaterThanOrEqual(4.5, $array['rating']);
        $this->assertGreaterThanOrEqual(5, $array['completed_deliveries']);
    }

    /**
     * Test UserResource with non-recommended user
     * 
     * @return void
     */
    public function test_user_resource_with_non_recommended_user(): void
    {
        $user = User::factory()->create([
            'rating' => 3.5,
            'completed_deliveries' => 2,
            'is_recommended' => false,
        ]);

        $resource = new UserResource($user);
        $array = $resource->toArray(request());

        $this->assertFalse($array['is_recommended']);
    }
}
