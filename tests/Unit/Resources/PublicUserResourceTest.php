<?php

namespace Tests\Unit\Resources;

use App\Http\Resources\PublicUserResource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test PublicUserResource transformation
 * 
 * Validates Requirements: 10.1, 10.2, 12.14
 */
class PublicUserResourceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test PublicUserResource includes only public fields
     * 
     * @return void
     */
    public function test_public_user_resource_includes_only_public_fields(): void
    {
        // Create a user with all fields
        $user = User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'phone' => '+33612345678',
            'avatar' => 'https://example.com/avatar.jpg',
            'rating' => 4.5,
            'completed_deliveries' => 8,
            'is_recommended' => true,
            'kyc_status' => 'approved',
            'locale' => 'en',
        ]);

        // Transform using PublicUserResource
        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        // Assert only public fields are present
        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('name', $array);
        $this->assertArrayHasKey('avatar', $array);
        $this->assertArrayHasKey('rating', $array);
        $this->assertArrayHasKey('completed_deliveries', $array);
        $this->assertArrayHasKey('is_recommended', $array);
        $this->assertArrayHasKey('created_at', $array);

        // Assert sensitive fields are NOT present
        $this->assertArrayNotHasKey('email', $array);
        $this->assertArrayNotHasKey('phone', $array);
        $this->assertArrayNotHasKey('kyc_status', $array);
        $this->assertArrayNotHasKey('locale', $array);
        $this->assertArrayNotHasKey('updated_at', $array);

        // Assert values are correct
        $this->assertEquals($user->id, $array['id']);
        $this->assertEquals('Jane Doe', $array['name']);
        $this->assertEquals('https://example.com/avatar.jpg', $array['avatar']);
        $this->assertEquals(4.5, $array['rating']);
        $this->assertEquals(8, $array['completed_deliveries']);
        $this->assertTrue($array['is_recommended']);
    }

    /**
     * Test PublicUserResource excludes email field
     * 
     * @return void
     */
    public function test_public_user_resource_excludes_email(): void
    {
        $user = User::factory()->create([
            'email' => 'secret@example.com',
        ]);

        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        $this->assertArrayNotHasKey('email', $array);
    }

    /**
     * Test PublicUserResource excludes phone field
     * 
     * @return void
     */
    public function test_public_user_resource_excludes_phone(): void
    {
        $user = User::factory()->create([
            'phone' => '+33698765432',
        ]);

        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        $this->assertArrayNotHasKey('phone', $array);
    }

    /**
     * Test PublicUserResource excludes kyc_status field
     * 
     * @return void
     */
    public function test_public_user_resource_excludes_kyc_status(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'approved',
        ]);

        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        $this->assertArrayNotHasKey('kyc_status', $array);
    }

    /**
     * Test PublicUserResource excludes locale field
     * 
     * @return void
     */
    public function test_public_user_resource_excludes_locale(): void
    {
        $user = User::factory()->create([
            'locale' => 'fr',
        ]);

        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        $this->assertArrayNotHasKey('locale', $array);
    }

    /**
     * Test PublicUserResource formats dates as ISO 8601
     * 
     * @return void
     */
    public function test_public_user_resource_formats_dates_as_iso8601(): void
    {
        $user = User::factory()->create();

        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        // Assert created_at is formatted as ISO 8601
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/',
            $array['created_at']
        );
    }

    /**
     * Test PublicUserResource handles null avatar
     * 
     * @return void
     */
    public function test_public_user_resource_handles_null_avatar(): void
    {
        $user = User::factory()->create([
            'avatar' => null,
        ]);

        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        $this->assertNull($array['avatar']);
    }

    /**
     * Test PublicUserResource with recommended user
     * 
     * @return void
     */
    public function test_public_user_resource_with_recommended_user(): void
    {
        $user = User::factory()->create([
            'rating' => 4.9,
            'completed_deliveries' => 20,
            'is_recommended' => true,
        ]);

        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        $this->assertTrue($array['is_recommended']);
        $this->assertEquals(4.9, $array['rating']);
        $this->assertEquals(20, $array['completed_deliveries']);
    }

    /**
     * Test PublicUserResource with non-recommended user
     * 
     * @return void
     */
    public function test_public_user_resource_with_non_recommended_user(): void
    {
        $user = User::factory()->create([
            'rating' => 3.0,
            'completed_deliveries' => 1,
            'is_recommended' => false,
        ]);

        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        $this->assertFalse($array['is_recommended']);
        $this->assertEquals(3.0, $array['rating']);
        $this->assertEquals(1, $array['completed_deliveries']);
    }

    /**
     * Test PublicUserResource with zero rating and deliveries
     * 
     * @return void
     */
    public function test_public_user_resource_with_zero_rating_and_deliveries(): void
    {
        $user = User::factory()->create([
            'rating' => 0,
            'completed_deliveries' => 0,
            'is_recommended' => false,
        ]);

        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        $this->assertEquals(0, $array['rating']);
        $this->assertEquals(0, $array['completed_deliveries']);
        $this->assertFalse($array['is_recommended']);
    }

    /**
     * Test PublicUserResource does not leak sensitive data even if present
     * 
     * @return void
     */
    public function test_public_user_resource_does_not_leak_sensitive_data(): void
    {
        $user = User::factory()->create([
            'email' => 'verysecret@example.com',
            'phone' => '+33600000000',
            'kyc_status' => 'rejected',
            'locale' => 'en',
        ]);

        $resource = new PublicUserResource($user);
        $array = $resource->toArray(request());

        // Verify no sensitive data is present
        $this->assertArrayNotHasKey('email', $array);
        $this->assertArrayNotHasKey('phone', $array);
        $this->assertArrayNotHasKey('kyc_status', $array);
        $this->assertArrayNotHasKey('locale', $array);
        
        // Verify the array doesn't contain sensitive values anywhere
        $jsonString = json_encode($array);
        $this->assertStringNotContainsString('verysecret@example.com', $jsonString);
        $this->assertStringNotContainsString('+33600000000', $jsonString);
        $this->assertStringNotContainsString('rejected', $jsonString);
    }
}
